import { Card } from '@health-heatmap/ui';
import { Pill, Calendar, Clock, ImageIcon } from 'lucide-react';

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

interface MedicationTableProps {
  medications: Medication[];
  onMedicationClick: (medication: Medication) => void;
}

export function MedicationTable({ medications, onMedicationClick }: MedicationTableProps) {
  const formatDate = (date?: string) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPhotoUrl = (photoKey?: string) => {
    if (!photoKey) return null;
    // MinIO/S3 public URL pattern
    return `${import.meta.env.VITE_S3_PUBLIC_URL || 'http://localhost:9000'}/${
      import.meta.env.VITE_S3_BUCKET || 'health-heatmap'
    }/${photoKey}`;
  };

  return (
    <div className="space-y-3">
      {medications.map((med) => {
        const isActive = !med.stoppedAt;
        const photoUrl = getPhotoUrl(med.photoKey);

        return (
          <Card
            key={med.id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onMedicationClick(med)}
          >
            <div className="flex items-start gap-4">
              {/* Photo Thumbnail */}
              <div className="flex-shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={med.name}
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" />
                      {med.name}
                      {isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          Active
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {med.dosage && <span>{med.dosage}</span>}
                      {med.frequency && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {med.frequency}
                        </span>
                      )}
                      {med.condition && (
                        <span className="text-primary font-medium">For: {med.condition.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {med.startedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started: {formatDate(med.startedAt)}
                    </span>
                  )}
                  {med.stoppedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Stopped: {formatDate(med.stoppedAt)}
                    </span>
                  )}
                </div>

                {/* Notes Preview */}
                {med.notes && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{med.notes}</p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}