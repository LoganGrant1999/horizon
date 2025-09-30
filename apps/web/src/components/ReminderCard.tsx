import { Card } from '@health-heatmap/ui';
import { Clock, X } from 'lucide-react';

interface ReminderCardProps {
  lastEntryDate: Date | null;
  onDismiss: () => void;
}

export function ReminderCard({ lastEntryDate, onDismiss }: ReminderCardProps) {
  if (!lastEntryDate) return null;

  const daysSinceLastEntry = Math.floor(
    (new Date().getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastEntry < 3) return null;

  return (
    <Card className="p-4 bg-accent-peach/10 border-accent-peach/30">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-accent-peach mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">Haven't logged in a while?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            It's been {daysSinceLastEntry} days since your last entry. A quick check-in helps keep
            your health report accurate.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}