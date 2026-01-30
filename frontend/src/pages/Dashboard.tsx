import React, { useEffect, useCallback, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/Loading';
import { Button } from '../components/common/Button';
import { useProfileStore } from '../store/profileStore';
import { useTasksStore } from '../store/tasksStore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { dashboardData, fetchDashboard, isLoading, isOnboardingComplete, currentStage } = useProfileStore();
  const { tasks, fetchTasks, updateTask } = useTasksStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastUserId, setLastUserId] = useState<number | null>(null);

  // Use useCallback to prevent unnecessary re-renders
  const loadDashboardData = useCallback(async (force = false) => {
    try {
      await Promise.all([fetchDashboard(force), fetchTasks(force)]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, [fetchDashboard, fetchTasks]);

  // Detect user change and force fresh fetch
  useEffect(() => {
    if (user && user.id !== lastUserId) {
      setLastUserId(user.id);
      loadDashboardData(true); // Force refresh on user change
    }
  }, [user?.id, lastUserId]);

  // Only fetch once on component mount if not already loaded
  useEffect(() => {
    if (!dashboardData) {
      loadDashboardData();
    }
  }, [dashboardData]);

  const handleTaskToggle = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await updateTask(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </MainLayout>
    );
  }

  const stage = dashboardData?.stage || {
    current_stage: 'STAGE_1_PROFILE',
    stage_name: 'Building Profile',
    onboarding_completed: false,
    shortlist_count: 0,
    locked_count: 0,
  };
  const profile = dashboardData?.profile;
  const dashboardTasks = dashboardData?.tasks || [];
  const stageNumber = stage.current_stage?.split('_')[1] || '1';

  const stages = [
    {
      number: 1,
      name: 'Building Profile',
      description: 'Complete your academic and personal profile',
      icon: '📝',
      completed: isOnboardingComplete,
      current: currentStage === 1,
      actions: isOnboardingComplete
        ? []
        : [{ label: 'Complete Onboarding', action: () => navigate('/onboarding') }],
    },
    {
      number: 2,
      name: 'Discovering Universities',
      description: 'Explore and shortlist universities that match your profile',
      icon: '🔍',
      completed: currentStage > 2,
      current: currentStage === 2,
      actions: currentStage >= 2
        ? [{ label: 'Explore Universities', action: () => navigate('/universities?tab=all') }]
        : [],
    },
    {
      number: 3,
      name: 'Finalizing Universities',
      description: 'Lock your university choices to commit to your strategy',
      icon: '🎯',
      completed: currentStage > 3,
      current: currentStage === 3,
      actions: currentStage >= 3
        ? [{ label: 'Manage Universities', action: () => navigate('/universities') }]
        : [],
    },
    {
      number: 4,
      name: 'Preparing Applications',
      description: 'Complete tasks and prepare your applications',
      icon: '✍️',
      completed: currentStage > 4,
      current: currentStage === 4,
      actions: currentStage >= 4
        ? [
            { label: 'View Applications', action: () => navigate('/applications') },
          ]
        : [],
    },
  ];

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-primary-700 to-accent-700 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-white/90">
            Here's an overview of your study abroad journey
          </p>
        </div>

        {!isOnboardingComplete && (
          <Card>
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Action required</p>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Complete your onboarding to unlock the AI Counsellor
                </h2>
                <p className="text-sm text-neutral-600">
                  Finish your profile to get personalized recommendations and guidance.
                </p>
              </div>
              <Button onClick={() => navigate('/onboarding')}>Start Onboarding</Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm mb-1">Shortlisted</p>
                <p className="text-3xl font-bold text-neutral-900">{stage.shortlist_count}</p>
              </div>
              <div className="text-4xl">🎓</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm mb-1">Locked</p>
                <p className="text-3xl font-bold text-neutral-900">{stage.locked_count}</p>
              </div>
              <div className="text-4xl">🔒</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-neutral-900">{dashboardTasks.length}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {dashboardTasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile ? (
                <>
                  {profile.education_level && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Education</p>
                      <p className="text-sm font-medium text-neutral-900">
                        {profile.education_level} - {profile.major}
                      </p>
                    </div>
                  )}
                  {profile.target_degree && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Target Degree</p>
                      <p className="text-sm font-medium text-neutral-900">
                        {profile.target_degree} in {profile.field}
                      </p>
                    </div>
                  )}
                  {profile.intake_year && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Target Intake</p>
                      <p className="text-sm font-medium text-neutral-900">{profile.intake_year}</p>
                    </div>
                  )}
                  {profile.countries && profile.countries.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Preferred Countries</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.countries.map((country: string) => (
                          <Badge key={country} variant="info" size="sm">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.budget_range && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Budget</p>
                      <p className="text-sm font-medium text-neutral-900">{profile.budget_range}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-600">No profile data available</p>
              )}
            </CardContent>
          </Card>

          {/* Profile Readiness */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile ? (
                <>
                  {profile.ielts_status && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-neutral-700">IELTS/TOEFL</span>
                        <Badge
                          variant={
                            profile.ielts_status === 'Completed'
                              ? 'success'
                              : profile.ielts_status === 'Scheduled'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {profile.ielts_status}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {profile.gre_status && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-neutral-700">GRE/GMAT</span>
                        <Badge
                          variant={
                            profile.gre_status === 'Completed'
                              ? 'success'
                              : profile.gre_status === 'Scheduled'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {profile.gre_status}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {profile.sop_status && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-neutral-700">SOP</span>
                        <Badge
                          variant={
                            profile.sop_status === 'Ready'
                              ? 'success'
                              : profile.sop_status === 'Draft'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {profile.sop_status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-600">Complete onboarding to see readiness</p>
              )}
            </CardContent>
          </Card>

          {/* Current Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Current Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {stageNumber}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {stage.stage_name}
                </h3>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Shortlisted: {stage.shortlist_count}</span>
                  <span>Locked: {stage.locked_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Journey Stages */}
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6">Your Journey</h2>
          <div className="space-y-4">
            {stages.map((stageItem, index) => (
              <div key={stageItem.number} className="relative">
                {index < stages.length - 1 && (
                  <div
                    className={`absolute left-9 top-20 w-0.5 h-16 ${
                      stageItem.completed ? 'bg-green-500' : 'bg-neutral-200'
                    }`}
                  />
                )}

                <Card
                  padding="md"
                  className={`relative ${
                    stageItem.current
                      ? 'border-primary-400 bg-primary-50'
                      : stageItem.completed
                      ? 'border-green-200 bg-green-50'
                      : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                          stageItem.completed
                            ? 'bg-green-100 text-green-700'
                            : stageItem.current
                            ? 'bg-primary-200 text-primary-800'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {stageItem.completed ? '✓' : stageItem.icon}
                      </div>
                    </div>

                    <div className="flex-1 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          Stage {stageItem.number}: {stageItem.name}
                        </h3>
                        {stageItem.completed && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Completed
                          </span>
                        )}
                        {stageItem.current && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-600 mb-4">{stageItem.description}</p>

                      {stageItem.actions.length > 0 && (
                        <div className="flex gap-3 flex-wrap">
                          {stageItem.actions.map((action, idx) => (
                            <Button
                              key={idx}
                              variant={stageItem.current ? 'primary' : 'outline'}
                              size="sm"
                              onClick={action.action}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {!stageItem.completed && !stageItem.current && currentStage < stageItem.number && (
                        <p className="text-sm text-neutral-500">
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

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Tasks</CardTitle>
              <button
                onClick={() => navigate('/applications')}
                className="text-sm text-primary-700 hover:text-primary-800 font-medium"
              >
                View all →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {!isOnboardingComplete ? (
              <p className="text-center text-neutral-600 py-8">
                Complete onboarding to unlock tasks and application tracking.
              </p>
            ) : tasks.length === 0 ? (
              <p className="text-center text-neutral-600 py-8">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => handleTaskToggle(task.id, task.status)}
                        className="w-5 h-5 rounded border-neutral-300 text-primary-600"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-neutral-500 line-through' : 'text-neutral-900'}`}>
                          {task.title}
                        </p>
                        {task.stage && (
                          <p className="text-xs text-neutral-600 mt-0.5">{task.stage_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        task.status === 'completed'
                          ? 'success'
                          : task.status === 'in_progress'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
