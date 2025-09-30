import { useState, useEffect } from 'react';
import { QuickAddCard } from '@/components/QuickAddCard';
import { WeekSummaryCard } from '@/components/WeekSummaryCard';
import { BodyMapMiniWidget } from '@/components/BodyMapMiniWidget';
import { ReminderCard } from '@/components/ReminderCard';
import { Toast } from '@/components/Toast';
import { VitalsChart, SymptomFrequencyChart, ActivityChart } from '@/components/HealthCharts';
import { Button } from '@health-heatmap/ui';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RegionData {
  region: string;
  displayName: string;
  count: number;
}

interface WeekSummary {
  symptomCount: number;
  avgHeartRate?: number;
  avgBloodPressure?: string;
  totalActivityMinutes: number;
}

export default function DashboardPage() {
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary>({
    symptomCount: 0,
    totalActivityMinutes: 0,
  });
  const [lastEntryDate, setLastEntryDate] = useState<Date | null>(null);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [totalEntryCount, setTotalEntryCount] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [vitalsChartData, setVitalsChartData] = useState<Array<{ date: string; value: number }>>([]);
  const [symptomFrequencyData, setSymptomFrequencyData] = useState<Array<{ name: string; count: number }>>([]);
  const [activityChartData, setActivityChartData] = useState<Array<{ date: string; minutes: number }>>([]);

  const loadDashboardData = async () => {
    try {
      // Load regions
      const regionsRes = await fetch('/api/regions/summary', { credentials: 'include' });
      if (regionsRes.ok) {
        const data = await regionsRes.json();
        setRegionData(data.regions);
      }

      // Load week summary (symptoms from last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const symptomsRes = await fetch('/api/symptoms', { credentials: 'include' });
      if (symptomsRes.ok) {
        const data = await symptomsRes.json();
        const symptoms = data.symptoms || [];

        // Count symptoms in last 7 days
        const recentSymptoms = symptoms.filter((s: any) =>
          new Date(s.createdAt) >= sevenDaysAgo
        );

        // Calculate vitals averages
        const vitals = recentSymptoms.filter((s: any) => s.category === 'VITAL' && s.vitalsJson);
        const hrValues = vitals.map((v: any) => v.vitalsJson?.hr).filter(Boolean);
        const bpValues = vitals.map((v: any) => v.vitalsJson?.bp).filter(Boolean);

        // Calculate activity totals
        const activities = recentSymptoms.filter((s: any) => s.category === 'ACTIVITY' && s.activityJson);
        const totalMinutes = activities.reduce((sum: number, a: any) =>
          sum + (a.activityJson?.durationMin || 0), 0
        );

        setWeekSummary({
          symptomCount: recentSymptoms.filter((s: any) => s.category === 'SYMPTOM').length,
          avgHeartRate: hrValues.length > 0
            ? Math.round(hrValues.reduce((a: number, b: number) => a + b, 0) / hrValues.length)
            : undefined,
          avgBloodPressure: bpValues[0],
          totalActivityMinutes: totalMinutes,
        });

        // Get last entry date
        if (symptoms.length > 0) {
          const sortedSymptoms = symptoms.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setLastEntryDate(new Date(sortedSymptoms[0].createdAt));
        }

        // Total entry count for toast
        setTotalEntryCount(symptoms.length);

        // Prepare chart data
        // Vitals chart - heart rate over last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const recentVitals = symptoms.filter((s: any) =>
          s.category === 'VITAL' &&
          s.vitalsJson?.hr &&
          new Date(s.startedAt) >= fourteenDaysAgo
        );

        const vitalsData = recentVitals.map((v: any) => ({
          date: new Date(v.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: v.vitalsJson.hr,
        })).reverse();

        setVitalsChartData(vitalsData);

        // Symptom frequency - last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentSymptomsForFreq = symptoms.filter((s: any) =>
          s.category === 'SYMPTOM' &&
          new Date(s.startedAt) >= thirtyDaysAgo
        );

        const symptomCounts: Record<string, number> = {};
        recentSymptomsForFreq.forEach((s: any) => {
          symptomCounts[s.title] = (symptomCounts[s.title] || 0) + 1;
        });

        const symptomFreqData = Object.entries(symptomCounts)
          .map(([name, count]) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count);

        setSymptomFrequencyData(symptomFreqData);

        // Activity chart - last 14 days
        const recentActivities = symptoms.filter((s: any) =>
          s.category === 'ACTIVITY' &&
          s.activityJson?.durationMin &&
          new Date(s.startedAt) >= fourteenDaysAgo
        );

        const activityData = recentActivities.map((a: any) => ({
          date: new Date(a.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          minutes: a.activityJson.durationMin,
        })).reverse();

        setActivityChartData(activityData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleEntryAdded = async () => {
    await loadDashboardData();

    // Show toast after 3rd entry
    const newCount = totalEntryCount + 1;
    if (newCount === 3) {
      setToastMessage(
        "Nice! Your report is already taking shape. Try generating a preview from the Reports page."
      );
      setShowToast(true);
    }
  };

  const handleAnalyzeSymptoms = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/analyze-symptoms', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Analysis failed');
      }

      const data = await res.json();
      setAiInsights(data.insights ?? 'No insights found.');
      setToastMessage('AI analysis complete!');
      setShowToast(true);
    } catch (e: any) {
      setAiError(e.message ?? 'Something went wrong');
      setToastMessage('AI analysis failed');
      setShowToast(true);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your health overview.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="mb-4 text-xs text-slate-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        Disclaimer: This is for organization and information only. It is NOT medical advice. Always consult your healthcare provider.
      </div>

      {/* Reminder */}
      {!reminderDismissed && (
        <ReminderCard
          lastEntryDate={lastEntryDate}
          onDismiss={() => setReminderDismissed(true)}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today - Quick Add */}
        <QuickAddCard onEntryAdded={handleEntryAdded} />

        {/* Week Summary */}
        <WeekSummaryCard data={weekSummary} />

        {/* Body Map Mini Widget */}
        <div className="md:col-span-2">
          <BodyMapMiniWidget regions={regionData} />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VitalsChart data={vitalsChartData} title="Heart Rate Trend" color="#00BFA6" unit="bpm" />
        <SymptomFrequencyChart data={symptomFrequencyData} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ActivityChart data={activityChartData} />
      </div>

      {/* AI Insights Section */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">AI Health Insights</h2>
            <p className="text-sm text-muted-foreground">
              Get personalized insights based on your recent symptoms
            </p>
          </div>
          <Button
            onClick={handleAnalyzeSymptoms}
            disabled={aiLoading || weekSummary.symptomCount === 0}
            className="h-11 min-w-[44px]"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Symptoms
              </>
            )}
          </Button>
        </div>

        {aiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{aiError}</p>
          </div>
        )}

        {aiLoading && (
          <div className="bg-gradient-to-br from-primary/5 to-accent-periwinkle/10 rounded-lg p-12 border border-primary/20">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Analyzing your health data with AI...</p>
            </div>
          </div>
        )}

        {aiInsights && !aiLoading && (
          <div className="bg-gradient-to-br from-primary/5 to-accent-periwinkle/10 rounded-lg p-6 border border-primary/20">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Health Patterns
            </h3>
            <div className="prose prose-sm max-w-none text-foreground [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>h4]:text-base [&>h4]:font-semibold [&>h4]:mt-3 [&>h4]:mb-2 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-3 [&>li]:mb-1 [&_strong]:font-semibold">
              <ReactMarkdown>{aiInsights}</ReactMarkdown>
            </div>
          </div>
        )}

        {!aiInsights && !aiError && weekSummary.symptomCount === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Add some symptoms to get AI-powered insights</p>
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}