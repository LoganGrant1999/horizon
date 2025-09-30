import { Sunrise, Sparkles } from 'lucide-react';
import type { OnboardingData } from '../OnboardingPage';

interface WelcomeStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

export default function WelcomeStep({ data, updateData }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-8 py-8">
      <div className="flex justify-center">
        <div className="relative">
          <Sunrise className="h-24 w-24 text-primary" />
          <Sparkles className="h-8 w-8 text-accent-peach absolute -top-2 -right-2" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-serif font-bold text-foreground">
          Welcome to Horizon
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We'll build a simple picture of your health—at your pace.
        </p>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          The next few steps will help us understand your health journey. You can skip any step and
          come back to it later.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-accent-peach/10 border-2 border-accent-peach/30 rounded-xl p-6">
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={data.importDemo}
              onChange={(e) => updateData({ importDemo: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary"
            />
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground mb-1">Load Sample Profile</p>
              <p className="text-sm text-muted-foreground">
                Perfect for demos! Includes AFib and Migraine conditions, 6 journal entries, vitals, activities, medications with photos, and a pre-generated report. You can remove these anytime.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
          <span>📊</span>
          <span>Takes about 5 minutes</span>
          <span>•</span>
          <span>✨</span>
          <span>All data stays private</span>
        </div>
      </div>
    </div>
  );
}