import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfileStore } from '../store/profileStore';
import { PageLoader } from '../components/common/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = true,
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isOnboardingComplete, checkOnboardingStatus, isLoading: profileLoading } = useProfileStore();
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const verify = async () => {
      if (isAuthenticated && requireOnboarding) {
        await checkOnboardingStatus();
      }
      setIsChecking(false);
    };
    verify();
  }, [isAuthenticated, requireOnboarding, checkOnboardingStatus]);

  if (authLoading || isChecking) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && !isOnboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
