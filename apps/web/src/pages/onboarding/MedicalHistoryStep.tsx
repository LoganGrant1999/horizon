import type { OnboardingData } from '../OnboardingPage';
import { FileText } from 'lucide-react';

interface MedicalHistoryStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

export default function MedicalHistoryStep({ data, updateData }: MedicalHistoryStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Medical History</h2>
        <p className="text-muted-foreground">
          Share key events like surgeries, hospitalizations, or allergies that help paint your
          health picture.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-accent-periwinkle/10 border border-accent-periwinkle/30 rounded-lg p-4 text-sm">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-accent-periwinkle flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">This information is saved privately</p>
              <p className="text-muted-foreground">
                Consider including: major surgeries, hospitalizations, allergies (medications,
                foods), family history, and any other significant medical events.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Medical history notes
          </label>
          <textarea
            value={data.medicalHistory}
            onChange={(e) => updateData({ medicalHistory: e.target.value })}
            placeholder="Example:&#10;- Appendectomy in 2015&#10;- Allergic to penicillin&#10;- Father has history of heart disease&#10;- Hospitalized for pneumonia in 2020"
            rows={12}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {data.medicalHistory.length} characters
          </p>
        </div>
      </div>

      {data.medicalHistory.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            You can skip this step and add your medical history later in your journal.
          </p>
        </div>
      )}
    </div>
  );
}