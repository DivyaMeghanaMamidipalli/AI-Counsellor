import { useProfileStore } from '../store/profileStore';

export const useStage = () => {
  const {
    currentStage,
    isOnboardingComplete,
    dashboardData,
    isLoading,
  } = useProfileStore();

  const getStageInfo = (stageNumber: number) => {
    const stages = {
      1: {
        name: 'Building Profile',
        description: 'Complete your profile and gather necessary documents',
        color: 'text-primary-700 bg-primary-100',
      },
      2: {
        name: 'Discovering Universities',
        description: 'Explore and shortlist universities that match your profile',
        color: 'text-accent-700 bg-accent-100',
      },
      3: {
        name: 'Finalizing Universities',
        description: 'Lock your university choices and commit to your strategy',
        color: 'text-neutral-700 bg-neutral-200',
      },
      4: {
        name: 'Preparing Applications',
        description: 'Complete tasks and prepare your applications',
        color: 'text-primary-800 bg-primary-200',
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
