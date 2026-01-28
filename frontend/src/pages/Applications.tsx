import React, { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/Loading';
import { useTasksStore } from '../store/tasksStore';
import { useUniversitiesStore } from '../store/universitiesStore';
import { tasksApi } from '../api/tasks';

export const Applications: React.FC = () => {
  const { tasks, isLoading, fetchTasks, updateTask, createTask, generateDefaultTasks } = useTasksStore();
  const { locked: lockedUniversities, fetchAll: fetchUniversities } = useUniversitiesStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchTasks(); // Will use cache if available
    fetchUniversities(); // Will use cache if available
  }, []);

  const handleTaskToggle = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await updateTask(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleGenerateDefaultTasks = async () => {
    try {
      await generateDefaultTasks();
    } catch (error) {
      console.error('Failed to generate default tasks:', error);
    }
  };

  const handleAddCustomTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      await createTask(newTaskTitle);
      setNewTaskTitle('');
      setShowAddTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await tasksApi.deleteTask(taskId);
      await fetchTasks(true); // Force refresh after delete
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <MainLayout title="Applications">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading applications..." />
        </div>
      </MainLayout>
    );
  }

  if (lockedUniversities.length === 0) {
    return (
      <MainLayout title="Applications">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-nude-900 mb-3">
            Lock a University First
          </h2>
          <p className="text-nude-600 mb-6">
            You need to lock at least one university before accessing application guidance
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/universities'}>
            Go to Universities
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Applications">
      <div className="space-y-6">
        {/* Locked Universities */}
        <Card>
          <CardHeader>
            <CardTitle>Locked Universities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedUniversities.map((uni) => (
                <div
                  key={uni.id}
                  className="p-4 bg-sand-50 rounded-lg border border-sand-200"
                >
                  <h3 className="font-semibold text-nude-900 mb-1">{uni.name}</h3>
                  <p className="text-sm text-nude-600">{uni.country}</p>
                  <div className="mt-2">
                    <Badge variant="warning" size="sm">
                      🔒 Locked
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="md">
            <p className="text-nude-600 text-sm mb-1">Total Tasks</p>
            <p className="text-2xl font-bold text-nude-900">{taskStats.total}</p>
          </Card>
          <Card padding="md">
            <p className="text-nude-600 text-sm mb-1">Pending</p>
            <p className="text-2xl font-bold text-cream-800">{taskStats.pending}</p>
          </Card>
          <Card padding="md">
            <p className="text-nude-600 text-sm mb-1">In Progress</p>
            <p className="text-2xl font-bold text-sand-800">{taskStats.in_progress}</p>
          </Card>
          <Card padding="md">
            <p className="text-nude-600 text-sm mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-800">{taskStats.completed}</p>
          </Card>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Tasks</CardTitle>
              <div className="flex gap-2">
                {tasks.length === 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateDefaultTasks}
                  >
                    Generate Default Tasks
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTask(!showAddTask)}
                >
                  + Add Custom Task
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showAddTask && (
              <div className="mb-4 p-4 bg-sand-50 rounded-lg border border-sand-200">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full px-3 py-2 border border-nude-300 rounded-lg mb-3"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAddCustomTask();
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddCustomTask}
                  >
                    Add Task
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTaskTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-nude-600 mb-4">No tasks found</p>
                {tasks.length === 0 && (
                  <Button
                    variant="primary"
                    onClick={handleGenerateDefaultTasks}
                  >
                    Generate Default Tasks
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-nude-200 hover:bg-nude-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleTaskToggle(task.id, task.status)}
                      className="mt-1 w-5 h-5 rounded border-nude-300 text-sand-700"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4
                          className={`font-medium ${
                            task.status === 'completed'
                              ? 'text-nude-500 line-through'
                              : 'text-nude-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <div className="flex gap-2">
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
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      {task.stage_name && (
                        <div className="text-xs text-nude-500">
                          Stage: {task.stage_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Required Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: 'Statement of Purpose', status: 'pending' },
                { name: 'Letters of Recommendation', status: 'pending' },
                { name: 'Academic Transcripts', status: 'completed' },
                { name: 'English Test Scores', status: 'in_progress' },
                { name: 'Resume/CV', status: 'completed' },
                { name: 'Financial Documents', status: 'pending' },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between p-3 bg-nude-50 rounded-lg"
                >
                  <span className="text-sm text-nude-900">{doc.name}</span>
                  <Badge
                    variant={
                      doc.status === 'completed'
                        ? 'success'
                        : doc.status === 'in_progress'
                        ? 'warning'
                        : 'default'
                    }
                    size="sm"
                  >
                    {doc.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
