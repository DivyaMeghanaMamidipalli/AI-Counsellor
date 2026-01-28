import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useStage } from '../../hooks/useStage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { currentStage, isOnboardingComplete, getStageInfo } = useStage();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      requiresOnboarding: true,
    },
    {
      name: 'AI Counsellor',
      path: '/counsellor',
      icon: '🤖',
      requiresOnboarding: true,
    },
    {
      name: 'Universities',
      path: '/universities',
      icon: '🎓',
      requiresOnboarding: true,
    },
    {
      name: 'Applications',
      path: '/applications',
      icon: '📝',
      requiresOnboarding: true,
      requiresStage: 4,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: '👤',
      requiresOnboarding: false,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const canAccess = (item: any) => {
    if (item.requiresOnboarding && !isOnboardingComplete) return false;
    if (item.requiresStage && currentStage < item.requiresStage) return false;
    return true;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-nude-200 
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-nude-200">
            <Link to="/home" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sand-600 to-nude-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                AC
              </div>
              <div>
                <h1 className="text-lg font-display font-semibold text-nude-900">
                  AI Counsellor
                </h1>
                <p className="text-xs text-nude-600">Study Abroad Guide</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const accessible = canAccess(item);
                const active = isActive(item.path);

                return (
                  <li key={item.path}>
                    <Link
                      to={accessible ? item.path : '#'}
                      onClick={(e) => {
                        if (!accessible) e.preventDefault();
                        if (isOpen) onClose();
                      }}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${
                          active
                            ? 'bg-sand-100 text-sand-800 font-medium'
                            : accessible
                            ? 'text-nude-700 hover:bg-nude-50'
                            : 'text-nude-400 cursor-not-allowed'
                        }
                      `}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm">{item.name}</span>
                      {!accessible && (
                        <span className="ml-auto text-xs">🔒</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-nude-200">
            {/* Settings button removed - no functionality implemented */}
          </div>
        </div>
      </aside>
    </>
  );
};
