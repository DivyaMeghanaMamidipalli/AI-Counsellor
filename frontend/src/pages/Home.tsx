import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useProfileStore } from '../store/profileStore';
import { LoadingSpinner } from '../components/common/Loading';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardData, fetchDashboard, isOnboardingComplete, currentStage, isLoading } = useProfileStore();

  useEffect(() => {
    if (isOnboardingComplete) {
      fetchDashboard();
    }
  }, [isOnboardingComplete, fetchDashboard]);

  // Stage information
  const stages = [
    {
      number: 1,
      name: 'Building Profile',
      description: 'Complete your academic and personal profile',
      icon: '📝',
      completed: isOnboardingComplete,
      current: currentStage === 1,
      actions: isOnboardingComplete ? [] : [
        { label: 'Complete Onboarding', action: () => navigate('/onboarding') }
      ]
    },
    {
      number: 2,
      name: 'Discovering Universities',
      description: 'Explore and shortlist universities that match your profile',
      icon: '🔍',
      completed: currentStage > 2,
      current: currentStage === 2,
      actions: currentStage >= 2 ? [
        { label: 'Explore Universities', action: () => navigate('/universities') }
      ] : []
    },
    {
      number: 3,
      name: 'Finalizing Universities',
      description: 'Lock your university choices to commit to your strategy',
      icon: '🎯',
      completed: currentStage > 3,
      current: currentStage === 3,
      actions: currentStage >= 3 ? [
        { label: 'Manage Universities', action: () => navigate('/universities') }
      ] : []
    },
    {
      number: 4,
      name: 'Preparing Applications',
      description: 'Complete tasks and prepare your applications',
      icon: '✍️',
      completed: currentStage > 4,
      current: currentStage === 4,
      actions: currentStage >= 4 ? [
        { label: 'View Applications', action: () => navigate('/applications') },
        { label: 'Go to Dashboard', action: () => navigate('/dashboard') }
      ] : []
    }
  ];

  if (isLoading) {
    return (
      <MainLayout title="Home">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Home">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-sand-700 to-nude-700 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-display font-bold mb-2">
            Welcome to AI Counsellor
          </h1>
          <p className="text-white/90 text-lg">
            Your personal guide to studying abroad. Follow these stages to complete your journey.
          </p>
        </div>

        {/* Current Stage Overview */}
        {isOnboardingComplete && dashboardData && (
          <Card>
            <CardHeader>
              <CardTitle>Your Current Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-sand-600 to-nude-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {currentStage}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-nude-900 mb-2">
                    {stages[currentStage - 1]?.name}
                  </h2>
                  <p className="text-nude-600 mb-4">
                    {stages[currentStage - 1]?.description}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <div className="text-sm">
                      <span className="text-nude-600">Shortlisted: </span>
                      <span className="font-semibold text-nude-900">{dashboardData.stage.shortlist_count}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-nude-600">Locked: </span>
                      <span className="font-semibold text-nude-900">{dashboardData.stage.locked_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage Timeline */}
        <div>
          <h2 className="text-2xl font-display font-bold text-nude-900 mb-6">Your Journey</h2>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.number} className="relative">
                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div className={`absolute left-9 top-20 w-0.5 h-16 ${
                    stage.completed ? 'bg-green-500' : 'bg-nude-200'
                  }`} />
                )}

                {/* Stage Card */}
                <Card padding="md" className={`relative ${
                  stage.current ? 'border-sand-400 bg-sand-50' : stage.completed ? 'border-green-200 bg-green-50' : ''
                }`}>
                  <div className="flex gap-4">
                    {/* Stage Indicator */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                        stage.completed
                          ? 'bg-green-100 text-green-700'
                          : stage.current
                          ? 'bg-sand-200 text-sand-800'
                          : 'bg-nude-200 text-nude-700'
                      }`}>
                        {stage.completed ? '✓' : stage.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-nude-900">
                          Stage {stage.number}: {stage.name}
                        </h3>
                        {stage.completed && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Completed
                          </span>
                        )}
                        {stage.current && (
                          <span className="px-2 py-1 bg-sand-100 text-sand-800 text-xs font-medium rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-nude-600 mb-4">{stage.description}</p>

                      {/* Stage Actions */}
                      {stage.actions.length > 0 && (
                        <div className="flex gap-3 flex-wrap">
                          {stage.actions.map((action, idx) => (
                            <Button
                              key={idx}
                              variant={stage.current ? 'primary' : 'outline'}
                              size="sm"
                              onClick={action.action}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Locked State */}
                      {!stage.completed && !stage.current && currentStage < stage.number && (
                        <p className="text-sm text-nude-500">
                          Complete previous stages to unlock this stage
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Navigation */}
        {isOnboardingComplete && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-4 rounded-lg border-2 border-nude-200 hover:border-sand-400 hover:bg-sand-50 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <p className="font-medium text-nude-900">Dashboard</p>
                </button>
                <button
                  onClick={() => navigate('/universities')}
                  className={`p-4 rounded-lg border-2 ${
                    currentStage >= 2
                      ? 'border-nude-200 hover:border-sand-400 hover:bg-sand-50'
                      : 'border-nude-200 cursor-not-allowed opacity-50'
                  } transition-colors text-center`}
                  disabled={currentStage < 2}
                >
                  <div className="text-2xl mb-2">🎓</div>
                  <p className="font-medium text-nude-900">Universities</p>
                </button>
                <button
                  onClick={() => navigate('/applications')}
                  className={`p-4 rounded-lg border-2 ${
                    currentStage >= 4
                      ? 'border-nude-200 hover:border-sand-400 hover:bg-sand-50'
                      : 'border-nude-200 cursor-not-allowed opacity-50'
                  } transition-colors text-center`}
                  disabled={currentStage < 4}
                >
                  <div className="text-2xl mb-2">📝</div>
                  <p className="font-medium text-nude-900">Applications</p>
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="p-4 rounded-lg border-2 border-nude-200 hover:border-sand-400 hover:bg-sand-50 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">👤</div>
                  <p className="font-medium text-nude-900">Profile</p>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
