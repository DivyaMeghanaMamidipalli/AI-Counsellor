import { useProfileStore } from '../store/profileStore';
import { useEffect } from 'react';

export const useStage = () => {
  const {
    currentStage,
    isOnboardingComplete,
    dashboardData,
    fetchDashboard,
    isLoading,
  } = useProfileStore();

  useEffect(() => {
    if (isOnboardingComplete && !dashboardData) {
      fetchDashboard();
    }
  }, [isOnboardingComplete, dashboardData, fetchDashboard]);

  const getStageInfo = (stageNumber: number) => {
    const stages = {
      1: {
        name: 'Building Profile',
        description: 'Complete your profile and gather necessary documents',
        color: 'text-cream-700 bg-cream-100',
      },
      2: {
        name: 'Discovering Universities',
        description: 'Explore and shortlist universities that match your profile',
        color: 'text-sand-700 bg-sand-100',
      },
      3: {
        name: 'Finalizing Universities',
        description: 'Lock your university choices and commit to your strategy',
        color: 'text-nude-700 bg-nude-200',
      },
      4: {
        name: 'Preparing Applications',
        description: 'Complete tasks and prepare your applications',
        color: 'text-sand-800 bg-sand-200',
      },
    };
    return stages[stageNumber as keyof typeof stages] || stages[1];
  };

  const canAccessStage = (requiredStage: number) => {
    return currentStage >= requiredStage;
  };

  const canAccessCounsellor = () => {
    return isOnboardingComplete;
  };

  const canAccessApplications = () => {
    return currentStage >= 4;
  };

  return {
    currentStage,
    isOnboardingComplete,
    getStageInfo,
    canAccessStage,
    canAccessCounsellor,
    canAccessApplications,
    isLoading,
  };
};
