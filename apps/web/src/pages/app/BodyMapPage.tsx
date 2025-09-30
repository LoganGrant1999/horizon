import { useState, useEffect } from 'react';
import { EmptyState, Button } from '@health-heatmap/ui';
import { Map, Activity } from 'lucide-react';
import { BodyMap, MedicalLabel, BodyPart } from '@/components/BodyMap';
import { RegionPanel } from '@/components/RegionPanel';
import { useNavigate } from 'react-router-dom';

interface RegionData {
  region: string;
  displayName: string;
  count: number;
  conditions?: string[];
}

interface RegionDetail {
  region: string;
  displayName: string;
  symptoms: any[];
  conditions: any[];
}

// Map database regions to BodyMap parts
const REGION_TO_BODY_PART: Record<string, BodyPart> = {
  HEAD: 'head',
  NECK: 'head',
  CHEST: 'chest',
  HEART: 'chest',
  LUNGS: 'chest',
  ABDOMEN: 'stomach',
  UPPER_BACK: 'chest',
  LOW_BACK: 'stomach',
  LEFT_ARM: 'left_arm',
  RIGHT_ARM: 'right_arm',
  LEFT_LEG: 'left_leg',
  RIGHT_LEG: 'right_leg',
  LEFT_HAND: 'left_hand',
  RIGHT_HAND: 'right_hand',
  LEFT_FOOT: 'left_foot',
  RIGHT_FOOT: 'right_foot',
  SKIN: 'chest',
  OTHER: 'stomach',
};

export default function BodyMapPage() {
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionDetail, setRegionDetail] = useState<RegionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadRegionsSummary = async () => {
    try {
      const res = await fetch('/api/regions/summary', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRegionData(data.regions);
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegionDetail = async (region: string) => {
    try {
      const res = await fetch(`/api/regions/${region}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRegionDetail(data);
      }
    } catch (error) {
      console.error('Failed to load region detail:', error);
    }
  };

  useEffect(() => {
    loadRegionsSummary();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      loadRegionDetail(selectedRegion);
    } else {
      setRegionDetail(null);
    }
  }, [selectedRegion]);

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
  };

  const handleAddSymptom = async (data: {
    title: string;
    severity: number | null;
    notes: string;
    startedAt: string;
  }) => {
    if (!selectedRegion) return;

    const res = await fetch('/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bodyRegion: selectedRegion,
        ...data,
      }),
      credentials: 'include',
    });

    if (res.ok) {
      // Reload both the summary and detail
      await Promise.all([loadRegionsSummary(), loadRegionDetail(selectedRegion)]);
    } else {
      throw new Error('Failed to add symptom');
    }
  };

  const handleAddCondition = async (data: { name: string; onsetDate?: string }) => {
    if (!selectedRegion) return;

    const res = await fetch('/api/conditions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bodyRegion: selectedRegion,
        ...data,
      }),
      credentials: 'include',
    });

    if (res.ok) {
      // Reload the detail
      await loadRegionDetail(selectedRegion);
    } else {
      throw new Error('Failed to add condition');
    }
  };

  const totalSymptoms = regionData.reduce((sum, r) => sum + r.count, 0);

  // Convert region data to medical labels for BodyMap
  const medicalLabels: MedicalLabel[] = regionData
    .filter((r) => r.count > 0)
    .map((r) => ({
      part: REGION_TO_BODY_PART[r.region] || 'stomach',
      title: r.displayName,
      conditions: r.conditions || [`${r.count} symptom${r.count !== 1 ? 's' : ''}`],
    }))
    // Group by body part (combine duplicate parts)
    .reduce((acc, label) => {
      const existing = acc.find((l) => l.part === label.part);
      if (existing) {
        existing.conditions.push(...label.conditions);
      } else {
        acc.push(label);
      }
      return acc;
    }, [] as MedicalLabel[]);

  const handleBodyPartClick = (part: BodyPart) => {
    // Find the first region that maps to this body part
    const matchingRegion = regionData.find(
      (r) => REGION_TO_BODY_PART[r.region] === part && r.count > 0
    );
    if (matchingRegion) {
      setSelectedRegion(matchingRegion.region);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading body map...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Body Map</h1>
            <p className="text-muted-foreground">
              Click on a body region to view and add symptoms or conditions
            </p>
          </div>

          {totalSymptoms === 0 ? (
            /* Empty State */
            <EmptyState
              icon={<Map className="h-12 w-12" />}
              title="No symptoms logged yet"
              description="Start by clicking on a body region to add your first symptom"
              action={
                <Button onClick={() => navigate('/app/journal')}>
                  <Activity className="h-4 w-4 mr-2" />
                  Or add via Journal
                </Button>
              }
            />
          ) : (
            /* Body Map */
            <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
              <BodyMap labels={medicalLabels} onPartClick={handleBodyPartClick} />
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing symptoms from the last 30 days • Total: {totalSymptoms}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Region Detail Panel */}
      {selectedRegion && regionDetail && (
        <RegionPanel
          region={selectedRegion}
          displayName={regionDetail.displayName}
          symptoms={regionDetail.symptoms}
          conditions={regionDetail.conditions}
          onClose={() => setSelectedRegion(null)}
          onAddSymptom={handleAddSymptom}
          onAddCondition={handleAddCondition}
        />
      )}
    </>
  );
}