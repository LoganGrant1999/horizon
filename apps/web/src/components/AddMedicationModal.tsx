import { useState, useEffect } from 'react';
import { Button, Card } from '@health-heatmap/ui';
import { X, Upload } from 'lucide-react';

interface Condition {
  id: string;
  name: string;
}

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicationFormData) => Promise<void>;
}

export interface MedicationFormData {
  name: string;
  dosage: string;
  frequency: string;
  startedAt: string;
  stoppedAt: string;
  notes: string;
  photoKey: string;
  bodyRegion: string;
  conditionId: string;
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

export function AddMedicationModal({ isOpen, onClose, onSubmit }: AddMedicationModalProps) {
  const [formData, setFormData] = useState<Partial<MedicationFormData>>({
    name: '',
    dosage: '',
    frequency: '',
    startedAt: '',
    stoppedAt: '',
    notes: '',
    photoKey: '',
    bodyRegion: '',
    conditionId: '',
  });
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConditions();
    }
  }, [isOpen]);

  const loadConditions = async () => {
    try {
      const res = await fetch('/api/conditions', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setConditions(data.conditions);
      }
    } catch (error) {
      console.error('Failed to load conditions:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Get presigned URL
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

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Set preview and key
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setFormData((prev) => ({ ...prev, photoKey: key }));
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData as MedicationFormData);
      // Reset form
      setFormData({
        name: '',
        dosage: '',
        frequency: '',
        startedAt: '',
        stoppedAt: '',
        notes: '',
        photoKey: '',
        bodyRegion: '',
        conditionId: '',
      });
      setPhotoPreview(null);
      onClose();
    } catch (error) {
      console.error('Failed to add medication:', error);
      alert('Failed to add medication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-foreground">Add Medication</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Medication Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Lisinopril"
            />
          </div>

          {/* Dosage and Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Dosage</label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 10mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Frequency</label>
              <input
                type="text"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Once daily"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Started Date</label>
              <input
                type="date"
                value={formData.startedAt}
                onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Stopped Date
              </label>
              <input
                type="date"
                value={formData.stoppedAt}
                onChange={(e) => setFormData({ ...formData, stoppedAt: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Body Region */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Body Region (Optional)
            </label>
            <select
              value={formData.bodyRegion}
              onChange={(e) => setFormData({ ...formData, bodyRegion: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">None</option>
              {BODY_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Associated Condition (Optional)
            </label>
            <select
              value={formData.conditionId}
              onChange={(e) => setFormData({ ...formData, conditionId: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">None</option>
              {conditions.map((condition) => (
                <option key={condition.id} value={condition.id}>
                  {condition.name}
                </option>
              ))}
            </select>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Label Photo (Optional)
            </label>
            <div className="flex items-start gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setFormData({ ...formData, photoKey: '' });
                    }}
                    className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 hover:bg-danger/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {isUploading ? (
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground text-center px-2">
                        Upload Photo
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name || isSubmitting || isUploading}>
              {isSubmitting ? 'Adding...' : 'Add Medication'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}