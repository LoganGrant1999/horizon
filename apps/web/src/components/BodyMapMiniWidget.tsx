import { Card, Button } from '@health-heatmap/ui';
import { MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RegionData {
  region: string;
  displayName: string;
  count: number;
}

interface BodyMapMiniWidgetProps {
  regions: RegionData[];
}

export function BodyMapMiniWidget({ regions }: BodyMapMiniWidgetProps) {
  const navigate = useNavigate();

  // Get top 3 hottest regions
  const topRegions = regions
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const getColorForCount = (count: number): string => {
    if (count >= 6) return 'text-danger bg-danger/10 border-danger/20';
    if (count >= 3) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-info bg-info/10 border-info/20';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Body Map Hotspots</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/body-map')}>
          View Full Map
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {topRegions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No symptoms logged yet</p>
          <p className="text-xs mt-1">Start logging to see your body map</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topRegions.map((region, index) => {
            const colorClass = getColorForCount(region.count);
            return (
              <button
                key={region.region}
                onClick={() => navigate('/app/body-map')}
                className={`w-full flex items-center justify-between p-3 rounded-lg border ${colorClass} transition-all hover:shadow-md`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-current/10">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{region.displayName}</div>
                    <div className="text-xs opacity-80">
                      {region.count} {region.count === 1 ? 'symptom' : 'symptoms'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 opacity-50" />
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}