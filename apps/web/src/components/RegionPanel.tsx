import { useState } from 'react';
import { Button, Card } from '@health-heatmap/ui';
import { X, Plus, Calendar, AlertCircle } from 'lucide-react';

interface Symptom {
  id: string;
  title: string;
  severity?: number;
  notes?: string;
  startedAt?: string;
  createdAt: string;
}

interface Condition {
  id: string;
  name: string;
  description?: string;
  onsetDate?: string;
  status: string;
}

interface RegionPanelProps {
  region: string;
  displayName: string;
  symptoms: Symptom[];
  conditions: Condition[];
  onClose: () => void;
  onAddSymptom: (data: {
    title: string;
    severity: number | null;
    notes: string;
    startedAt: string;
  }) => Promise<void>;
  onAddCondition: (data: { name: string; onsetDate?: string }) => Promise<void>;
}

export function RegionPanel({
  displayName,
  symptoms,
  conditions,
  onClose,
  onAddSymptom,
  onAddCondition,
}: RegionPanelProps) {
  const [activeTab, setActiveTab] = useState<'symptoms' | 'conditions'>('symptoms');
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Symptom form state
  const [symptomForm, setSymptomForm] = useState({
    title: '',
    severity: 5,
    notes: '',
    startedAt: new Date().toISOString().split('T')[0],
  });

  // Add Condition form state
  const [conditionForm, setConditionForm] = useState({
    name: '',
    onsetDate: '',
  });

  const handleAddSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddSymptom({
        ...symptomForm,
        severity: symptomForm.severity || null,
      });
      setSymptomForm({
        title: '',
        severity: 5,
        notes: '',
        startedAt: new Date().toISOString().split('T')[0],
      });
      setShowAddSymptom(false);
    } catch (error) {
      console.error('Failed to add symptom:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddCondition(conditionForm);
      setConditionForm({ name: '', onsetDate: '' });
      setShowAddCondition(false);
    } catch (error) {
      console.error('Failed to add condition:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''} •{' '}
            {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('symptoms')}
          className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'symptoms'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Symptoms ({symptoms.length})
        </button>
        <button
          onClick={() => setActiveTab('conditions')}
          className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'conditions'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Conditions ({conditions.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {activeTab === 'symptoms' && (
          <>
            {/* Add Symptom Button */}
            {!showAddSymptom && (
              <Button onClick={() => setShowAddSymptom(true)} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Symptom
              </Button>
            )}

            {/* Add Symptom Form */}
            {showAddSymptom && (
              <Card className="p-4 bg-accent-peach/5 border-accent-peach/20">
                <form onSubmit={handleAddSymptom} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
                      What happened? *
                    </label>
                    <input
                      type="text"
                      value={symptomForm.title}
                      onChange={(e) => setSymptomForm({ ...symptomForm, title: e.target.value })}
                      placeholder="e.g., Sharp pain, Dizziness, Swelling"
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
                      Severity (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={symptomForm.severity}
                      onChange={(e) =>
                        setSymptomForm({ ...symptomForm, severity: parseInt(e.target.value) })
                      }
                      className="w-full"
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Mild</span>
                      <span className="font-bold text-foreground">{symptomForm.severity}</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
                      Notes
                    </label>
                    <textarea
                      value={symptomForm.notes}
                      onChange={(e) => setSymptomForm({ ...symptomForm, notes: e.target.value })}
                      placeholder="Additional details..."
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
                      When did it start?
                    </label>
                    <input
                      type="date"
                      value={symptomForm.startedAt}
                      onChange={(e) =>
                        setSymptomForm({ ...symptomForm, startedAt: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting || !symptomForm.title} className="flex-1">
                      {isSubmitting ? 'Saving...' : 'Save Symptom'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddSymptom(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Symptoms List */}
            {symptoms.length === 0 && !showAddSymptom && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No symptoms logged for this region yet.</p>
              </div>
            )}

            {symptoms.map((symptom) => (
              <Card key={symptom.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{symptom.title}</h4>
                  {symptom.severity && (
                    <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full">
                      {symptom.severity}/10
                    </span>
                  )}
                </div>
                {symptom.notes && (
                  <p className="text-sm text-muted-foreground mb-2">{symptom.notes}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {symptom.startedAt
                      ? new Date(symptom.startedAt).toLocaleDateString()
                      : 'Date not specified'}
                  </span>
                </div>
              </Card>
            ))}
          </>
        )}

        {activeTab === 'conditions' && (
          <>
            {/* Add Condition Button */}
            {!showAddCondition && (
              <Button onClick={() => setShowAddCondition(true)} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            )}

            {/* Add Condition Form */}
            {showAddCondition && (
              <Card className="p-4 bg-accent-periwinkle/5 border-accent-periwinkle/20">
                <form onSubmit={handleAddCondition} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
                      Condition name *
                    </label>
                    <input
                      type="text"
                      value={conditionForm.name}
                      onChange={(e) => setConditionForm({ ...conditionForm, name: e.target.value })}
                      placeholder="e.g., Arthritis, Chronic pain"
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
                      Onset date (optional)
                    </label>
                    <input
                      type="date"
                      value={conditionForm.onsetDate}
                      onChange={(e) =>
                        setConditionForm({ ...conditionForm, onsetDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting || !conditionForm.name} className="flex-1">
                      {isSubmitting ? 'Saving...' : 'Save Condition'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddCondition(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Conditions List */}
            {conditions.length === 0 && !showAddCondition && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No conditions associated with this region yet.</p>
              </div>
            )}

            {conditions.map((condition) => (
              <Card key={condition.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{condition.name}</h4>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      condition.status === 'ACTIVE'
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {condition.status}
                  </span>
                </div>
                {condition.description && (
                  <p className="text-sm text-muted-foreground mb-2">{condition.description}</p>
                )}
                {condition.onsetDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Since {new Date(condition.onsetDate).toLocaleDateString()}</span>
                  </div>
                )}
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}