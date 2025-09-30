import { useState } from 'react';
import { Card } from '@health-heatmap/ui';
import { Activity, Heart, TrendingUp, FileText } from 'lucide-react';
import { QuickAddModal } from './QuickAddModal';

type QuickAddType = 'symptom' | 'vital' | 'activity' | 'note' | null;

interface QuickAddCardProps {
  onEntryAdded: () => void;
}

export function QuickAddCard({ onEntryAdded }: QuickAddCardProps) {
  const [activeType, setActiveType] = useState<QuickAddType>(null);

  const quickActions = [
    {
      type: 'symptom' as const,
      icon: Activity,
      label: 'Symptom',
      description: 'Log a new symptom',
      color: 'bg-warning/10 text-warning hover:bg-warning/20',
    },
    {
      type: 'vital' as const,
      icon: Heart,
      label: 'Vital',
      description: 'Record BP, HR, etc.',
      color: 'bg-danger/10 text-danger hover:bg-danger/20',
    },
    {
      type: 'activity' as const,
      icon: TrendingUp,
      label: 'Activity',
      description: 'Track exercise',
      color: 'bg-success/10 text-success hover:bg-success/20',
    },
    {
      type: 'note' as const,
      icon: FileText,
      label: 'Note',
      description: 'Quick journal entry',
      color: 'bg-info/10 text-info hover:bg-info/20',
    },
  ];

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Today</h2>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-4">Quick add to your health log</p>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.type}
                onClick={() => setActiveType(action.type)}
                className={`${action.color} p-4 rounded-lg transition-all border border-transparent hover:border-current`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">{action.label}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <QuickAddModal
        type={activeType}
        isOpen={activeType !== null}
        onClose={() => setActiveType(null)}
        onSuccess={() => {
          setActiveType(null);
          onEntryAdded();
        }}
      />
    </>
  );
}