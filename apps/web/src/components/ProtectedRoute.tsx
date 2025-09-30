import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

export function ProtectedRoute({ children, skipOnboardingCheck = false }: ProtectedRouteProps) {
  const { user, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(!skipOnboardingCheck);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Check if user needs onboarding (after first login)
  useEffect(() => {
    if (!user || skipOnboardingCheck || isLoading) {
      setCheckingOnboarding(false);
      return;
    }

    // Skip check if coming from onboarding completion
    if (location.state?.skipOnboardingCheck) {
      setNeedsOnboarding(false);
      setCheckingOnboarding(false);
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        // Check if user has any conditions or medications
        const res = await fetch('/api/onboarding/status', { credentials: 'include' });
        if (res.ok) {
          const { needsOnboarding: needs } = await res.json();
          setNeedsOnboarding(needs);
        } else {
          setNeedsOnboarding(false);
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setNeedsOnboarding(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, skipOnboardingCheck, isLoading, location.state]);

  if (isLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if needed (only for app routes, not onboarding page itself)
  // Don't redirect if we just came from completing onboarding
  if (!skipOnboardingCheck && needsOnboarding && location.pathname !== '/onboarding' && !location.state?.skipOnboardingCheck) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}