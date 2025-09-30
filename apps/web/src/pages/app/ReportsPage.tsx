import { useState, useEffect, useRef } from 'react';
import { EmptyState, Button, Card } from '@health-heatmap/ui';
import { FileText, Download, Calendar, Loader2, Trash2 } from 'lucide-react';
import { BodyHeatmap } from '@/components/BodyHeatmap';

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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regionData, setRegionData] = useState<RegionData[]>([]);

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

        {/* Generate Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Generate New Report</h2>

          {/* Date Range Picker */}
          <div className="grid grid-cols-2 gap-4 mb-6">
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

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Report will include: conditions, symptoms, vitals, activities, medications, and journal notes
            </p>
            <Button onClick={handleGenerateReport} disabled={isGenerating} size="lg">
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
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-muted-foreground hover:text-danger transition-colors"
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
      </div>
    </div>
  );
}