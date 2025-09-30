import { useState } from 'react';
import { Button } from '@health-heatmap/ui';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
import type { OnboardingData } from '../OnboardingPage';

interface PrescriptionsStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

export default function PrescriptionsStep({ data, updateData }: PrescriptionsStepProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const addMedication = () => {
    updateData({
      medications: [
        ...data.medications,
        {
          name: '',
          dosage: '',
          frequency: '',
          startedAt: '',
          stoppedAt: '',
        },
      ],
    });
  };

  const removeMedication = (index: number) => {
    updateData({
      medications: data.medications.filter((_, i) => i !== index),
    });
  };

  const updateMedication = (
    index: number,
    updates: Partial<OnboardingData['medications'][0]>
  ) => {
    const updated = [...data.medications];
    updated[index] = { ...updated[index], ...updates };
    updateData({ medications: updated });
  };

  const handleFileUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      // Request presigned URL
      const presignRes = await fetch('/api/storage/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
        credentials: 'include',
      });

      if (!presignRes.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl, key } = await presignRes.json();

      // Upload to MinIO
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      // Update medication with photo key
      updateMedication(index, { photoKey: key });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
          Current & Previous Prescriptions
        </h2>
        <p className="text-muted-foreground">
          Add medications you're currently taking or have taken in the past.
        </p>
      </div>

      <div className="space-y-4">
        {data.medications.map((med, index) => (
          <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Medication {index + 1}
              </h4>
              <button
                onClick={() => removeMedication(index)}
                className="text-muted-foreground hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Medication name *
                </label>
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) => updateMedication(index, { name: e.target.value })}
                  placeholder="e.g., Lisinopril"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, { dosage: e.target.value })}
                  placeholder="e.g., 10mg"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, { frequency: e.target.value })}
                  placeholder="e.g., Once daily"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Started
                </label>
                <input
                  type="date"
                  value={med.startedAt}
                  onChange={(e) => updateMedication(index, { startedAt: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Stopped (if applicable)
                </label>
                <input
                  type="date"
                  value={med.stoppedAt}
                  onChange={(e) => updateMedication(index, { stoppedAt: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Photo (optional)
              </label>
              {med.photoKey ? (
                <div className="flex items-center gap-2 text-sm text-success">
                  <Upload className="h-4 w-4" />
                  <span>Photo uploaded</span>
                  <button
                    onClick={() => updateMedication(index, { photoKey: undefined })}
                    className="text-danger hover:underline ml-auto"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(index, file);
                    }}
                    disabled={uploadingIndex === index}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary-600"
                  />
                  {uploadingIndex === index && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addMedication} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {data.medications.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No medications added yet. Click "Add Medication" to get started.</p>
        </div>
      )}
    </div>
  );
}