import { Card } from '@health-heatmap/ui';
import { Activity, Heart, TrendingUp } from 'lucide-react';

interface WeekSummaryData {
  symptomCount: number;
  avgHeartRate?: number;
  avgBloodPressure?: string;
  totalActivityMinutes: number;
}

interface WeekSummaryCardProps {
  data: WeekSummaryData;
}

export function WeekSummaryCard({ data }: WeekSummaryCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">This Week at a Glance</h2>

      <div className="grid grid-cols-3 gap-4">
        {/* Symptoms */}
        <div className="text-center p-4 bg-warning/5 rounded-lg border border-warning/20">
          <Activity className="h-6 w-6 text-warning mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{data.symptomCount}</div>
          <div className="text-xs text-muted-foreground mt-1">New Symptoms</div>
        </div>

        {/* Vitals */}
        <div className="text-center p-4 bg-danger/5 rounded-lg border border-danger/20">
          <Heart className="h-6 w-6 text-danger mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">
            {data.avgHeartRate ? `${data.avgHeartRate}` : '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {data.avgHeartRate ? 'Avg HR (bpm)' : 'No vitals'}
          </div>
          {data.avgBloodPressure && (
            <div className="text-xs text-muted-foreground mt-1">BP: {data.avgBloodPressure}</div>
          )}
        </div>

        {/* Activities */}
        <div className="text-center p-4 bg-success/5 rounded-lg border border-success/20">
          <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{data.totalActivityMinutes}</div>
          <div className="text-xs text-muted-foreground mt-1">Activity Minutes</div>
        </div>
      </div>
    </Card>
  );
}