import { useState, useEffect } from 'react';
import { QuickAddCard } from '@/components/QuickAddCard';
import { WeekSummaryCard } from '@/components/WeekSummaryCard';
import { BodyMapMiniWidget } from '@/components/BodyMapMiniWidget';
import { ReminderCard } from '@/components/ReminderCard';
import { Toast } from '@/components/Toast';

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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your health overview.
        </p>
      </div>

      {/* Reminder */}
      {!reminderDismissed && (
        <ReminderCard
          lastEntryDate={lastEntryDate}
          onDismiss={() => setReminderDismissed(true)}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today - Quick Add */}
        <QuickAddCard onEntryAdded={handleEntryAdded} />

        {/* Week Summary */}
        <WeekSummaryCard data={weekSummary} />

        {/* Body Map Mini Widget */}
        <div className="lg:col-span-2">
          <BodyMapMiniWidget regions={regionData} />
        </div>
      </div>

      {/* Toast */}
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}