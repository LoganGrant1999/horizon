import { useState, useEffect, useRef } from 'react';
import { EmptyState, Button, Card } from '@health-heatmap/ui';
import { FileText, Download, Calendar, Loader2, Trash2, Sparkles } from 'lucide-react';
import { BodyHeatmap } from '@/components/BodyHeatmap';
import { Toast } from '@/components/Toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';

interface Report {
  id: string;
  title: string;
  generatedAt: string;
  downloadUrl: string;
}

interface RegionData {
  region: string;
  displayName: string;
  count: number;
}

const PROMPTS = {
  translate: "Translate this into simple English.",
  questions: "List three simple questions to ask my doctor about this.",
  sidefx: "Summarize the side effects I should be aware of."
} as const;

type PromptKey = keyof typeof PROMPTS;

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Custom AI prompt state
  const [promptMode, setPromptMode] = useState<PromptKey>('translate');
  const [promptInput, setPromptInput] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptOutput, setPromptOutput] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // PDF export refs
  const aiReportPdfRef = useRef<HTMLDivElement>(null);
  const customPromptPdfRef = useRef<HTMLDivElement>(null);

  // Date range state (default last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const heatmapRef = useRef<HTMLDivElement>(null);

  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegionData = async () => {
    try {
      const res = await fetch('/api/regions/summary', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRegionData(data.regions);
      }
    } catch (error) {
      console.error('Failed to load region data:', error);
    }
  };

  useEffect(() => {
    loadReports();
    loadRegionData();
  }, []);

  const exportHeatmapToBlob = async (): Promise<string | undefined> => {
    if (!heatmapRef.current) return undefined;

    try {
      // Use html2canvas or similar - for now, we'll skip this and return undefined
      // The backend will generate the report without the heatmap image
      // TODO: Implement proper client-side SVG to PNG conversion
      return undefined;
    } catch (error) {
      console.error('Failed to export heatmap:', error);
      return undefined;
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Optional: Export heatmap to image
      const heatmapImageKey = await exportHeatmapToBlob();

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          heatmapImageKey,
        }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        await loadReports();

        // Auto-download the generated report
        window.open(data.report.downloadUrl, '_blank');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        await loadReports();
      } else {
        throw new Error('Failed to delete report');
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const handleGenerateAIReport = async () => {
    setAiReportLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Report generation failed');
      }

      const data = await res.json();
      setAiReport(data.report ?? 'No report generated.');
    } catch (e: any) {
      setAiError(e.message ?? 'Something went wrong');
    } finally {
      setAiReportLoading(false);
    }
  };

  const handleRunCustomPrompt = async () => {
    setPromptLoading(true);
    setPromptOutput(null);
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: promptInput,
          instruction: PROMPTS[promptMode],
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        setToastMessage('Report failed');
        setShowToast(true);
        return;
      }

      const data = await res.json();
      setPromptOutput(data.result ?? '');
      setToastMessage('Report ready');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Report failed');
      setShowToast(true);
    } finally {
      setPromptLoading(false);
    }
  };

  const exportToPDF = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const ratio = pageWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 20, canvas.width * ratio, canvas.height * ratio);
      pdf.save(filename);
      setToastMessage('PDF exported successfully');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to export PDF');
      setShowToast(true);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Health Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive PDF reports for your healthcare provider
          </p>
        </div>

        {/* AI Report Section */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent-periwinkle/10 border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Health Summary
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Get an instant AI-generated overview of your health data
              </p>
            </div>
            <Button
              onClick={handleGenerateAIReport}
              disabled={aiReportLoading}
              className="h-11 min-w-[44px]"
            >
              {aiReportLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Summary
                </>
              )}
            </Button>
          </div>

          {aiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">{aiError}</p>
            </div>
          )}

          {aiReportLoading && (
            <div className="bg-white rounded-lg p-12 border border-border">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Analyzing your health data with AI...</p>
              </div>
            </div>
          )}

          {aiReport && !aiReportLoading && (
            <div className="space-y-3">
              <div ref={aiReportPdfRef} className="bg-white rounded-lg p-6 border border-border">
                <div className="prose prose-sm max-w-none text-foreground [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>h4]:text-base [&>h4]:font-semibold [&>h4]:mt-3 [&>h4]:mb-2 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-3 [&>li]:mb-1 [&_strong]:font-semibold">
                  <ReactMarkdown>{aiReport}</ReactMarkdown>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => exportToPDF(aiReportPdfRef, `horizon-health-summary-${Date.now()}.pdf`)}
                className="w-full h-11 min-w-[44px]"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          )}

          {!aiReport && !aiError && !aiReportLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Click the button above to generate your AI health summary</p>
            </div>
          )}
        </Card>

        {/* Custom AI Prompts Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Medical Assistant
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Paste doctor notes, prescription names, or medical terms to get AI assistance
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Choose what you need help with
              </label>
              <select
                value={promptMode}
                onChange={(e) => setPromptMode(e.target.value as PromptKey)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="translate">Translate to plain English</option>
                <option value="questions">3 doctor questions</option>
                <option value="sidefx">Side effects summary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Your text
              </label>
              <textarea
                className="w-full border border-input rounded-lg p-3 h-40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Paste the doctor note / term / prescription name…"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
              />
            </div>

            <Button
              onClick={handleRunCustomPrompt}
              disabled={promptLoading || !promptInput.trim()}
              className="w-full h-11 min-w-[44px]"
            >
              {promptLoading ? 'Generating…' : 'Generate AI Report'}
            </Button>

            {promptOutput && (
              <div className="space-y-3">
                <div ref={customPromptPdfRef} className="mt-4 rounded-xl border border-border p-4 bg-white">
                  <h3 className="font-semibold mb-2 text-foreground">Result</h3>
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {promptOutput}
                  </pre>
                </div>
                <Button
                  variant="outline"
                  onClick={() => exportToPDF(customPromptPdfRef, `horizon-ai-report-${Date.now()}.pdf`)}
                  className="w-full h-11 min-w-[44px]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Generate Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Generate PDF Report</h2>

          {/* Date Range Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Heatmap Preview (Hidden, used for export) */}
          <div ref={heatmapRef} className="mb-6 bg-white p-4 rounded-lg border border-border">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Report Preview (Body Map)
            </p>
            {regionData.length > 0 && (
              <BodyHeatmap data={regionData} onRegionClick={() => {}} />
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Report will include: conditions, symptoms, vitals, activities, medications, and journal notes
            </p>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              size="lg"
              className="h-11 min-w-[44px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Reports List */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Previous Reports</h2>

          {reports.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No reports yet"
              description="Generate your first health report to share with your healthcare provider"
            />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{report.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(report.generatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(report.downloadUrl, '_blank')}
                        className="h-11 min-w-[44px]"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 h-11 w-11 min-w-[44px] text-muted-foreground hover:text-danger transition-colors"
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Toast */}
        <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      </div>
    </div>
  );
}