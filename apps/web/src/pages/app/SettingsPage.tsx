import { EmptyState } from '@health-heatmap/ui';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-6">Settings</h1>
      <EmptyState
        icon={<Settings className="h-12 w-12" />}
        title="Settings Coming Soon"
        description="Manage your account and preferences"
      />
    </div>
  );
}