import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../../store/profileStore';
import { useUniversitiesStore } from '../../store/universitiesStore';
import { useTasksStore } from '../../store/tasksStore';
import { useOptionsStore } from '../../store/optionsStore';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleLogout = () => {
    // Clear all Zustand store states
    useProfileStore.setState({
      onboardingData: null,
      isOnboardingComplete: false,
      dashboardData: null,
      currentStage: 1,
      isLoading: false,
      error: null,
      lastFetchTime: null,
    });
    
    useUniversitiesStore.setState({
      recommendations: null,
      shortlisted: [],
      locked: [],
      allUniversities: [],
      isLoading: false,
      error: null,
      lastFetchTime: null,
      fetchInProgress: false,
    });
    
    useTasksStore.setState({
      tasks: [],
      isLoading: false,
      error: null,
      lastFetchTime: null,
      fetchInProgress: false,
    });

    useOptionsStore.setState({
      options: null,
      isLoading: false,
      error: null,
      lastFetchTime: null,
    });

    // Clear all localStorage keys related to user data (persist middleware)
    const keysToRemove = ['profile-storage', 'universities-storage', 'options-storage'];
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-md">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-neutral-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {title && (
            <h1 className="text-xl font-display font-semibold text-neutral-900">
              {title}
            </h1>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
              </div>
              <svg
                className={`w-4 h-4 text-neutral-700 transition-transform ${
                  showDropdown ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-20">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <span>👤</span>
                    <span>Profile</span>
                  </button>
                  
                  <div className="border-t border-neutral-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
