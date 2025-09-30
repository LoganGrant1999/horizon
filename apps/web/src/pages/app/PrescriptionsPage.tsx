import { useState, useEffect } from 'react';
import { EmptyState, Button } from '@health-heatmap/ui';
import { Pill, Plus } from 'lucide-react';
import { MedicationTable } from '@/components/MedicationTable';
import { AddMedicationModal, MedicationFormData } from '@/components/AddMedicationModal';
import { MedicationDetailDrawer } from '@/components/MedicationDetailDrawer';

interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  startedAt?: string;
  stoppedAt?: string;
  notes?: string;
  photoKey?: string;
  bodyRegion?: string;
  condition?: {
    id: string;
    name: string;
  };
}

export default function PrescriptionsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [filterActive, setFilterActive] = useState(false);

  const loadMedications = async () => {
    try {
      const res = await fetch(
        `/api/medications${filterActive ? '?active=true' : ''}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications);
      }
    } catch (error) {
      console.error('Failed to load medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, [filterActive]);

  const handleAddMedication = async (data: MedicationFormData) => {
    const res = await fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (res.ok) {
      await loadMedications();
    } else {
      throw new Error('Failed to add medication');
    }
  };

  const handleUpdateMedication = async (id: string, data: Partial<Medication>) => {
    const res = await fetch(`/api/medications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (res.ok) {
      await loadMedications();
      // Update selected medication if it's currently open
      if (selectedMedication?.id === id) {
        const updated = await res.json();
        setSelectedMedication(updated.medication);
      }
    } else {
      throw new Error('Failed to update medication');
    }
  };

  const handleDeleteMedication = async (id: string) => {
    const res = await fetch(`/api/medications/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      await loadMedications();
      setSelectedMedication(null);
    } else {
      throw new Error('Failed to delete medication');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading medications...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Prescriptions</h1>
              <p className="text-muted-foreground">
                Track your medications with photos and dosage information
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="h-11 min-w-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterActive(false)}
              className={`px-4 h-11 min-w-[44px] rounded-lg text-sm font-medium transition-colors ${
                !filterActive
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-4 h-11 min-w-[44px] rounded-lg text-sm font-medium transition-colors ${
                filterActive
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Active Only
            </button>
          </div>

          {/* List */}
          {medications.length === 0 ? (
            <EmptyState
              icon={<Pill className="h-12 w-12" />}
              title="No medications yet"
              description="Add your first medication to start tracking dosages, schedules, and photos"
              action={
                <Button onClick={() => setShowAddModal(true)} className="h-11 min-w-[44px]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              }
            />
          ) : (
            <MedicationTable
              medications={medications}
              onMedicationClick={(med) => setSelectedMedication(med)}
            />
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AddMedicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMedication}
      />

      {/* Detail Drawer */}
      <MedicationDetailDrawer
        medication={selectedMedication}
        onClose={() => setSelectedMedication(null)}
        onUpdate={handleUpdateMedication}
        onDelete={handleDeleteMedication}
      />
    </>
  );
}