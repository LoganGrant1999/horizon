import { useState, useEffect } from 'react';
import { Card, Button } from '@health-heatmap/ui';
import { X } from 'lucide-react';
import { analytics } from '@/lib/analytics';

type QuickAddType = 'symptom' | 'vital' | 'activity' | 'note' | null;

interface QuickAddModalProps {
  type: QuickAddType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BODY_REGIONS = [
  'HEAD',
  'NECK',
  'CHEST',
  'HEART',
  'LUNGS',
  'ABDOMEN',
  'LOW_BACK',
  'UPPER_BACK',
  'LEFT_ARM',
  'RIGHT_ARM',
  'LEFT_LEG',
  'RIGHT_LEG',
  'SKIN',
  'OTHER',
];

export function QuickAddModal({ type, isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Symptom fields
  const [symptomData, setSymptomData] = useState({
    title: '',
    bodyRegion: 'OTHER',
    severity: 5,
    notes: '',
  });

  // Vital fields
  const [vitalData, setVitalData] = useState({
    bp: '',
    hr: '',
    tempC: '',
    spo2: '',
  });

  // Activity fields
  const [activityData, setActivityData] = useState({
    type: '',
    distanceKm: '',
    durationMin: '',
    perceivedExertion: '',
  });

  // Note fields
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset forms when modal closes
      setSymptomData({ title: '', bodyRegion: 'OTHER', severity: 5, notes: '' });
      setVitalData({ bp: '', hr: '', tempC: '', spo2: '' });
      setActivityData({ type: '', distanceKm: '', durationMin: '', perceivedExertion: '' });
      setNoteText('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let payload: any = {
        bodyRegion: 'OTHER',
        category: type?.toUpperCase() || 'NOTE',
        startedAt: new Date().toISOString(),
      };

      if (type === 'symptom') {
        payload = {
          ...payload,
          title: symptomData.title,
          bodyRegion: symptomData.bodyRegion,
          severity: symptomData.severity,
          notes: symptomData.notes || null,
          category: 'SYMPTOM',
        };
      } else if (type === 'vital') {
        const vitalsJson: any = {};
        if (vitalData.bp) vitalsJson.bp = vitalData.bp;
        if (vitalData.hr) vitalsJson.hr = parseInt(vitalData.hr);
        if (vitalData.tempC) vitalsJson.tempC = parseFloat(vitalData.tempC);
        if (vitalData.spo2) vitalsJson.spo2 = parseInt(vitalData.spo2);

        payload = {
          ...payload,
          title: 'Vital Signs',
          vitalsJson,
          category: 'VITAL',
        };
      } else if (type === 'activity') {
        const activityJson: any = {};
        if (activityData.type) activityJson.type = activityData.type;
        if (activityData.distanceKm) activityJson.distanceKm = parseFloat(activityData.distanceKm);
        if (activityData.durationMin)
          activityJson.durationMin = parseInt(activityData.durationMin);
        if (activityData.perceivedExertion)
          activityJson.perceivedExertion = parseInt(activityData.perceivedExertion);

        payload = {
          ...payload,
          title: activityData.type || 'Activity',
          activityJson,
          category: 'ACTIVITY',
        };
      } else if (type === 'note') {
        payload = {
          ...payload,
          title: 'Note',
          notes: noteText,
          category: 'NOTE',
        };
      }

      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (res.ok) {
        // Track first symptom entry
        if (type === 'symptom') {
          analytics.firstSymptomEntry();
        }
        analytics.symptomAdded(type?.toUpperCase() || 'UNKNOWN');
        onSuccess();
      } else {
        throw new Error('Failed to add entry');
      }
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Failed to add entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-foreground capitalize">
            Add {type}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'symptom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Symptom *
                </label>
                <input
                  type="text"
                  value={symptomData.title}
                  onChange={(e) => setSymptomData({ ...symptomData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Headache"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Body Region
                </label>
                <select
                  value={symptomData.bodyRegion}
                  onChange={(e) => setSymptomData({ ...symptomData, bodyRegion: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {BODY_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Severity: {symptomData.severity}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={symptomData.severity}
                  onChange={(e) =>
                    setSymptomData({ ...symptomData, severity: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={symptomData.notes}
                  onChange={(e) => setSymptomData({ ...symptomData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Any additional details..."
                />
              </div>
            </>
          )}

          {type === 'vital' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    value={vitalData.bp}
                    onChange={(e) => setVitalData({ ...vitalData, bp: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={vitalData.hr}
                    onChange={(e) => setVitalData({ ...vitalData, hr: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="72"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalData.tempC}
                    onChange={(e) => setVitalData({ ...vitalData, tempC: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="37.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={vitalData.spo2}
                    onChange={(e) => setVitalData({ ...vitalData, spo2: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="98"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'activity' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Activity Type *
                </label>
                <input
                  type="text"
                  value={activityData.type}
                  onChange={(e) => setActivityData({ ...activityData, type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Running, Walking, Cycling"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={activityData.distanceKm}
                    onChange={(e) =>
                      setActivityData({ ...activityData, distanceKm: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={activityData.durationMin}
                    onChange={(e) =>
                      setActivityData({ ...activityData, durationMin: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Perceived Exertion (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={activityData.perceivedExertion}
                  onChange={(e) =>
                    setActivityData({ ...activityData, perceivedExertion: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="7"
                />
              </div>
            </>
          )}

          {type === 'note' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Note *</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                required
                rows={5}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Write your note here..."
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}