import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@health-heatmap/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WelcomeStep from './onboarding/WelcomeStep';
import ConditionsStep from './onboarding/ConditionsStep';
import MedicalHistoryStep from './onboarding/MedicalHistoryStep';
import PrescriptionsStep from './onboarding/PrescriptionsStep';
import { analytics } from '@/lib/analytics';

export interface OnboardingData {
  importDemo: boolean;
  conditions: Array<{
    name: string;
    onsetDate?: string;
  }>;
  medicalHistory: string;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    startedAt?: string;
    stoppedAt?: string;
    photoKey?: string;
  }>;
}

const STEPS = [
  { id: 1, title: 'Welcome', component: WelcomeStep },
  { id: 2, title: 'Conditions', component: ConditionsStep },
  { id: 3, title: 'Medical History', component: MedicalHistoryStep },
  { id: 4, title: 'Prescriptions', component: PrescriptionsStep },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [data, setData] = useState<OnboardingData>({
    importDemo: false,
    conditions: [],
    medicalHistory: '',
    medications: [],
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    // Create minimal profile
    setIsSubmitting(true);
    try {
      await fetch('/api/onboarding/skip', {
        method: 'POST',
        credentials: 'include',
      });
      // Small delay to ensure database writes are committed
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/app/dashboard', { replace: true, state: { skipOnboardingCheck: true } });
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      analytics.onboardingCompleted();
      // Small delay to ensure database writes are committed
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/app/dashboard', { replace: true, state: { skipOnboardingCheck: true } });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const isLastStep = currentStep === STEPS.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent-peach/10 to-accent-periwinkle/10">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-colors ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            {STEPS.map((step) => (
              <div key={step.id} className="flex-1 text-center">
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-xl shadow-xl p-8 mb-6">
          <CurrentStepComponent data={data} updateData={updateData} />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
            Do this later
          </Button>

          {isLastStep ? (
            <Button onClick={handleFinish} disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Finishing...' : 'Finish Setup'}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={isSubmitting}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}