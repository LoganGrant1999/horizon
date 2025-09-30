import { useState } from 'react';
import { Button } from '@health-heatmap/ui';
import { Plus, X } from 'lucide-react';
import type { OnboardingData } from '../OnboardingPage';

interface ConditionsStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const COMMON_CONDITIONS = [
  'Hypertension',
  'Type 2 Diabetes',
  'Asthma',
  'Anxiety',
  'Depression',
  'Migraine',
  'Arthritis',
  'GERD',
  'Hypothyroidism',
  'High Cholesterol',
  'Sleep Apnea',
  'Atrial Fibrillation',
];

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

export default function ConditionsStep({ data, updateData }: ConditionsStepProps) {
  const [customCondition, setCustomCondition] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addCondition = (name: string) => {
    if (!name.trim()) return;

    const newCondition = {
      name: name.trim(),
      bodyRegion: 'OTHER',
      onsetDate: undefined,
    };

    updateData({
      conditions: [...data.conditions, newCondition],
    });
    setEditingIndex(data.conditions.length);
    setCustomCondition('');
  };

  const removeCondition = (index: number) => {
    updateData({
      conditions: data.conditions.filter((_, i) => i !== index),
    });
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const updateCondition = (index: number, updates: Partial<OnboardingData['conditions'][0]>) => {
    const updated = [...data.conditions];
    updated[index] = { ...updated[index], ...updates };
    updateData({ conditions: updated });
  };

  const isSelected = (name: string) =>
    data.conditions.some((c) => c.name.toLowerCase() === name.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
          Existing Conditions
        </h2>
        <p className="text-muted-foreground">
          Select any conditions you're currently managing or have been diagnosed with.
        </p>
      </div>

      {/* Common Conditions Chips */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Common conditions</h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_CONDITIONS.map((condition) => {
            const selected = isSelected(condition);
            return (
              <button
                key={condition}
                onClick={() => {
                  if (selected) {
                    const index = data.conditions.findIndex(
                      (c) => c.name.toLowerCase() === condition.toLowerCase()
                    );
                    removeCondition(index);
                  } else {
                    addCondition(condition);
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {condition}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Condition Input */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Add your own</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCondition}
            onChange={(e) => setCustomCondition(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addCondition(customCondition);
              }
            }}
            placeholder="Type a condition name..."
            className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={() => addCondition(customCondition)} disabled={!customCondition.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected Conditions with Details */}
      {data.conditions.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-foreground">Your conditions</h3>
          {data.conditions.map((condition, index) => (
            <div
              key={index}
              className="p-4 bg-muted/50 rounded-lg border border-border space-y-3"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-foreground">{condition.name}</h4>
                <button
                  onClick={() => removeCondition(index)}
                  className="text-muted-foreground hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {editingIndex === index && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Body region
                    </label>
                    <select
                      value={condition.bodyRegion}
                      onChange={(e) => updateCondition(index, { bodyRegion: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {BODY_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Onset date (optional)
                    </label>
                    <input
                      type="date"
                      value={condition.onsetDate || ''}
                      onChange={(e) => updateCondition(index, { onsetDate: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingIndex(null)}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              )}

              {editingIndex !== index && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{condition.bodyRegion.replace(/_/g, ' ')}</span>
                  {condition.onsetDate && <span>Since {condition.onsetDate}</span>}
                  <button
                    onClick={() => setEditingIndex(index)}
                    className="text-primary hover:underline ml-auto"
                  >
                    Edit details
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.conditions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No conditions selected yet. You can skip this step if you prefer.</p>
        </div>
      )}
    </div>
  );
}