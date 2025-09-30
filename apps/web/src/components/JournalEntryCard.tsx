import { useState } from 'react';
import { Card } from '@health-heatmap/ui';
import { Calendar, Activity, Heart, TrendingUp, FileText, Edit2, Loader2 } from 'lucide-react';

interface ParsedSymptom {
  id: string;
  title: string;
  category: string;
  bodyRegion: string;
  severity?: number;
  vitalsJson?: any;
  activityJson?: any;
}

interface JournalEntry {
  id: string;
  rawText: string;
  parseStatus: string;
  parsedAt?: string;
  createdAt: string;
  symptoms?: ParsedSymptom[];
}

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEditClassification: (symptomId: string, symptom: ParsedSymptom) => void;
}

const CATEGORY_ICONS = {
  SYMPTOM: Activity,
  VITAL: Heart,
  ACTIVITY: TrendingUp,
  NOTE: FileText,
};

const CATEGORY_COLORS = {
  SYMPTOM: 'bg-warning/10 text-warning border-warning/20',
  VITAL: 'bg-danger/10 text-danger border-danger/20',
  ACTIVITY: 'bg-success/10 text-success border-success/20',
  NOTE: 'bg-info/10 text-info border-info/20',
};

export function JournalEntryCard({ entry, onEditClassification }: JournalEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatBodyRegion = (region: string) => {
    return region.replace(/_/g, ' ').toLowerCase();
  };

  const renderVitals = (vitalsJson: any) => {
    const vitals = [];
    if (vitalsJson.bp) vitals.push(`BP: ${vitalsJson.bp}`);
    if (vitalsJson.hr) vitals.push(`HR: ${vitalsJson.hr} bpm`);
    if (vitalsJson.tempC) vitals.push(`Temp: ${vitalsJson.tempC}°C`);
    if (vitalsJson.spo2) vitals.push(`SpO2: ${vitalsJson.spo2}%`);
    return vitals.join(' • ');
  };

  const renderActivity = (activityJson: any) => {
    const parts = [];
    if (activityJson.type) parts.push(activityJson.type);
    if (activityJson.distanceKm) parts.push(`${activityJson.distanceKm}km`);
    if (activityJson.durationMin) parts.push(`${activityJson.durationMin}min`);
    if (activityJson.perceivedExertion)
      parts.push(`Exertion: ${activityJson.perceivedExertion}/10`);
    return parts.join(' • ');
  };

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(entry.createdAt)}</span>
          {entry.parseStatus === 'PENDING' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing...
            </span>
          )}
          {entry.parseStatus === 'PARSED' && entry.symptoms && entry.symptoms.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
              {entry.symptoms.length} item{entry.symptoms.length !== 1 ? 's' : ''} extracted
            </span>
          )}
        </div>
      </div>

      {/* Raw Text */}
      <p
        className={`text-foreground mb-4 leading-relaxed ${
          expanded ? '' : 'line-clamp-3'
        }`}
      >
        {entry.rawText}
      </p>

      {!expanded && entry.rawText.length > 200 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-primary hover:underline mb-4"
        >
          Show more
        </button>
      )}

      {/* Parsed Symptoms */}
      {entry.symptoms && entry.symptoms.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Extracted Data</p>
          <div className="space-y-2">
            {entry.symptoms.map((symptom) => {
              const Icon = CATEGORY_ICONS[symptom.category as keyof typeof CATEGORY_ICONS];
              const colorClass =
                CATEGORY_COLORS[symptom.category as keyof typeof CATEGORY_COLORS];

              return (
                <div
                  key={symptom.id}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${colorClass}`}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {Icon && <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{symptom.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs opacity-80">
                        <span className="capitalize">{formatBodyRegion(symptom.bodyRegion)}</span>
                        {symptom.severity && <span>• Severity: {symptom.severity}/10</span>}
                        {symptom.vitalsJson && <span>• {renderVitals(symptom.vitalsJson)}</span>}
                        {symptom.activityJson && (
                          <span>• {renderActivity(symptom.activityJson)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onEditClassification(symptom.id, symptom)}
                    className="text-current hover:opacity-70 transition-opacity flex-shrink-0"
                    title="Edit classification"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}