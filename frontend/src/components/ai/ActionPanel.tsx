import React from 'react';
import { Badge } from '../common/Badge';

interface Action {
  id: string;
  type: 'university_shortlisted' | 'university_locked' | 'task_created' | 'task_completed';
  title: string;
  description: string;
  timestamp: Date;
  data?: any;
}

interface ActionPanelProps {
  actions: Action[];
  onUndo?: (actionId: string) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ actions, onUndo }) => {
  const getActionIcon = (type: string) => {
    const icons = {
      university_shortlisted: '🎓',
      university_locked: '🔒',
      task_created: '✅',
      task_completed: '🎯',
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const getActionBadge = (type: string) => {
    const badges = {
      university_shortlisted: { label: 'Shortlisted', variant: 'info' as const },
      university_locked: { label: 'Locked', variant: 'warning' as const },
      task_created: { label: 'Task Created', variant: 'default' as const },
      task_completed: { label: 'Completed', variant: 'success' as const },
    };
    return badges[type as keyof typeof badges] || { label: 'Action', variant: 'default' as const };
  };

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-neutral-100 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Actions</h3>
        <div className="text-center py-8">
          <p className="text-neutral-600">No recent actions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-100 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Actions</h3>
      
      <div className="space-y-3">
        {actions.map((action) => {
          const badge = getActionBadge(action.type);
          return (
            <div
              key={action.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <span className="text-2xl">{getActionIcon(action.type)}</span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-neutral-900 truncate">
                    {action.title}
                  </h4>
                  <Badge variant={badge.variant} size="sm">
                    {badge.label}
                  </Badge>
                </div>
                
                <p className="text-xs text-neutral-600 line-clamp-2">
                  {action.description}
                </p>
                
                <p className="text-xs text-neutral-500 mt-1">
                  {action.timestamp.toLocaleString()}
                </p>
              </div>
              
              {onUndo && (
                <button
                  onClick={() => onUndo(action.id)}
                  className="text-xs text-primary-700 hover:text-primary-800 font-medium"
                >
                  Undo
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
