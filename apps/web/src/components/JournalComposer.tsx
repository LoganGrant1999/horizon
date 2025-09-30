import { useState } from 'react';
import { Button } from '@health-heatmap/ui';
import { Send, Sparkles } from 'lucide-react';

interface JournalComposerProps {
  onSubmit: (text: string) => Promise<void>;
}

export function JournalComposer({ onSubmit }: JournalComposerProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text);
      setText('');
    } catch (error) {
      console.error('Failed to submit journal entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., My blood pressure was 120/80. Ran 5 miles without shortness of breath. Had a mild headache this afternoon."
          rows={6}
          disabled={isSubmitting}
          className="w-full px-4 py-3 pr-12 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none text-base"
        />
        <div className="absolute bottom-3 right-3">
          <Sparkles className="h-5 w-5 text-primary opacity-50" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 inline mr-1.5" />
          AI will automatically extract structured health data
        </div>
        <Button type="submit" disabled={!text.trim() || isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Entry
            </>
          )}
        </Button>
      </div>

      <div className="bg-info/10 border border-info/20 rounded-lg p-3 text-sm">
        <p className="font-medium text-foreground mb-1">Privacy & AI Note</p>
        <p className="text-muted-foreground">
          Your journal entries are analyzed to extract health metrics only. We do not provide
          medical diagnoses or advice. Always consult your healthcare provider for medical
          decisions.
        </p>
      </div>
    </form>
  );
}