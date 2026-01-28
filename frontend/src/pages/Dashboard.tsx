import React, { useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingSpinner } from '../components/common/Loading';
import { useProfileStore } from '../store/profileStore';
import { useTasksStore } from '../store/tasksStore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { dashboardData, fetchDashboard, isLoading } = useProfileStore();
  const { tasks, fetchTasks, updateTask } = useTasksStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard(); // Will use cache if available
    fetchTasks(); // Will use cache if available
  }, []);

  const handleTaskToggle = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await updateTask(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </MainLayout>
    );
  }

  const { profile, stage, tasks: dashboardTasks, shortlisted_universities } = dashboardData;

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-sand-700 to-nude-700 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-white/90">
            Here's an overview of your study abroad journey
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-nude-600 text-sm mb-1">Shortlisted</p>
                <p className="text-3xl font-bold text-nude-900">{stage.shortlist_count}</p>
              </div>
              <div className="text-4xl">🎓</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-nude-600 text-sm mb-1">Locked</p>
                <p className="text-3xl font-bold text-nude-900">{stage.locked_count}</p>
              </div>
              <div className="text-4xl">🔒</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-nude-600 text-sm mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-nude-900">{dashboardTasks.length}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-nude-600 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-nude-900">
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
                      <p className="text-xs text-nude-600 mb-1">Education</p>
                      <p className="text-sm font-medium text-nude-900">
                        {profile.education_level} - {profile.major}
                      </p>
                    </div>
                  )}
                  {profile.target_degree && (
                    <div>
                      <p className="text-xs text-nude-600 mb-1">Target Degree</p>
                      <p className="text-sm font-medium text-nude-900">
                        {profile.target_degree} in {profile.field}
                      </p>
                    </div>
                  )}
                  {profile.intake_year && (
                    <div>
                      <p className="text-xs text-nude-600 mb-1">Target Intake</p>
                      <p className="text-sm font-medium text-nude-900">{profile.intake_year}</p>
                    </div>
                  )}
                  {profile.countries && profile.countries.length > 0 && (
                    <div>
                      <p className="text-xs text-nude-600 mb-1">Preferred Countries</p>
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
                      <p className="text-xs text-nude-600 mb-1">Budget</p>
                      <p className="text-sm font-medium text-nude-900">{profile.budget_range}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-nude-600">No profile data available</p>
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
                        <span className="text-sm text-nude-700">IELTS/TOEFL</span>
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
                        <span className="text-sm text-nude-700">GRE/GMAT</span>
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
                        <span className="text-sm text-nude-700">SOP</span>
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
                <p className="text-sm text-nude-600">Complete onboarding to see readiness</p>
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
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sand-600 to-nude-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {stage.current_stage.split('_')[1]}
                </div>
                <h3 className="text-lg font-semibold text-nude-900 mb-2">
                  {stage.stage_name}
                </h3>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-nude-600">
                  <span>Shortlisted: {stage.shortlist_count}</span>
                  <span>Locked: {stage.locked_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Tasks</CardTitle>
              <button
                onClick={() => navigate('/applications')}
                className="text-sm text-sand-700 hover:text-sand-800 font-medium"
              >
                View all →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-center text-nude-600 py-8">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-nude-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => handleTaskToggle(task.id, task.status)}
                        className="w-5 h-5 rounded border-nude-300 text-sand-700"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-nude-500 line-through' : 'text-nude-900'}`}>
                          {task.title}
                        </p>
                        {task.stage && (
                          <p className="text-xs text-nude-600 mt-0.5">{task.stage_name}</p>
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
