import { useState, useEffect } from 'react';
import { EmptyState } from '@health-heatmap/ui';
import { FileText } from 'lucide-react';
import { JournalComposer } from '@/components/JournalComposer';
import { JournalEntryCard } from '@/components/JournalEntryCard';

interface ParsedSymptom {
  id: string;
  title: string;
  category: string;
  bodyRegion: string;
  severity?: number;
  vitalsJson?: any;
  activityJson?: any;
}

interface JournalEntry {
  id: string;
  rawText: string;
  parseStatus: string;
  parsedAt?: string;
  createdAt: string;
  symptoms?: ParsedSymptom[];
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = async () => {
    try {
      const res = await fetch('/api/journal', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();

    // Poll for updates to catch AI parsing completion
    const interval = setInterval(loadEntries, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (text: string) => {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: text }),
      credentials: 'include',
    });

    if (res.ok) {
      await loadEntries();
    } else {
      throw new Error('Failed to create journal entry');
    }
  };

  const handleEditClassification = (_symptomId: string, _symptom: ParsedSymptom) => {
    // TODO: Open edit dialog
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Health Journal</h1>
          <p className="text-muted-foreground">
            Write naturally about your health. AI will extract structured data automatically.
          </p>
        </div>

        {/* Composer */}
        <JournalComposer onSubmit={handleSubmit} />

        {/* Entries List */}
        {entries.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No journal entries yet"
            description="Start by writing your first entry above. AI will automatically extract health metrics, symptoms, and activities."
          />
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Entries</h2>
            <div className="space-y-4">
              {entries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  onEditClassification={handleEditClassification}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}