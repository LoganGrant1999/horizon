import { useState, useEffect } from 'react';
import { Button } from '@health-heatmap/ui';
import { X, Calendar, Clock, MapPin, FileText, Trash2, Upload } from 'lucide-react';

interface Condition {
  id: string;
  name: string;
}

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

interface MedicationDetailDrawerProps {
  medication: Medication | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Medication>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

export function MedicationDetailDrawer({
  medication,
  onClose,
  onUpdate,
  onDelete,
}: MedicationDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Medication>>({});
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (medication) {
      setEditData(medication);
      setPhotoPreview(getPhotoUrl(medication.photoKey));
      loadConditions();
    }
  }, [medication]);

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

  const getPhotoUrl = (photoKey?: string) => {
    if (!photoKey) return null;
    return `${import.meta.env.VITE_S3_PUBLIC_URL || 'http://localhost:9000'}/${
      import.meta.env.VITE_S3_BUCKET || 'health-heatmap'
    }/${photoKey}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
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

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setEditData((prev) => ({ ...prev, photoKey: key }));
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!medication) return;

    setIsSubmitting(true);
    try {
      await onUpdate(medication.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update medication:', error);
      alert('Failed to update medication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!medication) return;
    if (!confirm(`Are you sure you want to delete ${medication.name}?`)) return;

    setIsSubmitting(true);
    try {
      await onDelete(medication.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete medication:', error);
      alert('Failed to delete medication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Not set';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!medication) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background shadow-xl z-50 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">{medication.name}</h2>
              {!medication.stoppedAt && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success mt-2">
                  Active
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Photo */}
          {isEditing ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Label Photo</label>
              <div className="flex items-start gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt={medication.name}
                      className="w-full max-w-sm rounded-lg object-contain border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setEditData({ ...editData, photoKey: '' });
                      }}
                      className="absolute top-2 right-2 bg-danger text-white rounded-full p-2 hover:bg-danger/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full max-w-sm h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    {isUploading ? (
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Upload Photo</span>
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
          ) : (
            photoPreview && (
              <div>
                <img
                  src={photoPreview}
                  alt={medication.name}
                  className="w-full rounded-lg object-contain border border-border"
                />
              </div>
            )
          )}

          {/* Details */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Medication Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Dosage</label>
                  <input
                    type="text"
                    value={editData.dosage || ''}
                    onChange={(e) => setEditData({ ...editData, dosage: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={editData.frequency || ''}
                    onChange={(e) => setEditData({ ...editData, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Started Date
                  </label>
                  <input
                    type="date"
                    value={editData.startedAt?.split('T')[0] || ''}
                    onChange={(e) => setEditData({ ...editData, startedAt: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Stopped Date
                  </label>
                  <input
                    type="date"
                    value={editData.stoppedAt?.split('T')[0] || ''}
                    onChange={(e) => setEditData({ ...editData, stoppedAt: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Body Region
                </label>
                <select
                  value={editData.bodyRegion || ''}
                  onChange={(e) => setEditData({ ...editData, bodyRegion: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Associated Condition
                </label>
                <select
                  value={editData.condition?.id || ''}
                  onChange={(e) => {
                    const newData = { ...editData };
                    if (e.target.value) {
                      (newData as any).conditionId = e.target.value;
                    }
                    setEditData(newData);
                  }}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {medication.dosage && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dosage</p>
                    <p className="text-foreground">{medication.dosage}</p>
                  </div>
                </div>
              )}

              {medication.frequency && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                    <p className="text-foreground">{medication.frequency}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Started</p>
                  <p className="text-foreground">{formatDate(medication.startedAt)}</p>
                </div>
              </div>

              {medication.stoppedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stopped</p>
                    <p className="text-foreground">{formatDate(medication.stoppedAt)}</p>
                  </div>
                </div>
              )}

              {medication.bodyRegion && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Body Region</p>
                    <p className="text-foreground capitalize">
                      {medication.bodyRegion.replace(/_/g, ' ').toLowerCase()}
                    </p>
                  </div>
                </div>
              )}

              {medication.condition && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">For Condition</p>
                    <p className="text-foreground">{medication.condition.name}</p>
                  </div>
                </div>
              )}

              {medication.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-foreground whitespace-pre-wrap">{medication.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(medication);
                    setPhotoPreview(getPhotoUrl(medication.photoKey));
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={() => setIsEditing(true)}>Edit</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}