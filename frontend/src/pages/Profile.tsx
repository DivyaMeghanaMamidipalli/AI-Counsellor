import React, { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useProfileStore } from '../store/profileStore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, fetchDashboard } = useProfileStore();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const validatePassword = (password: string) => {
    const rules = {
      length: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
    return rules;
  };

  const passwordRules = validatePassword(passwordData.new_password);
  const isNewPasswordValid = Object.values(passwordRules).every(v => v);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (!isNewPasswordValid) {
      setPasswordError('Password does not meet the required criteria');
      return;
    }

    try {
      setPasswordLoading(true);
      await authApi.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setTimeout(() => {
        setShowPasswordModal(false);
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const profile = dashboardData?.profile;

  const profileSections = [
    {
      title: 'Personal Information',
      data: [
        { label: 'Full Name', value: user?.name || 'N/A' },
        { label: 'Email', value: user?.email || 'N/A' },
      ],
    },
    {
      title: 'Academic Background',
      data: profile
        ? [
            { label: 'Education Level', value: profile.education_level || 'N/A' },
            { label: 'Major', value: profile.major || 'N/A' },
            { label: 'Graduation Year', value: profile.graduation_year?.toString() || 'N/A' },
            { label: 'Academic Score', value: profile.academic_score?.toString() || 'N/A' },
          ]
        : [],
    },
    {
      title: 'Study Goals',
      data: profile
        ? [
            { label: 'Target Degree', value: profile.target_degree || 'N/A' },
            { label: 'Field of Study', value: profile.field || 'N/A' },
            { label: 'Target Intake', value: profile.intake_year?.toString() || 'N/A' },
            {
              label: 'Preferred Countries',
              value: profile.countries?.join(', ') || 'N/A',
            },
          ]
        : [],
    },
    {
      title: 'Budget & Funding',
      data: profile
        ? [
            {
              label: 'Budget Range',
              value: profile.budget_range || 'N/A',
            },
            { label: 'Funding Type', value: profile.funding_type || 'N/A' },
          ]
        : [],
    },
    {
      title: 'Test & Readiness',
      data: profile
        ? [
            { label: 'IELTS/TOEFL Status', value: profile.ielts_status || 'N/A' },
            { label: 'GRE/GMAT Status', value: profile.gre_status || 'N/A' },
            { label: 'SOP Status', value: profile.sop_status || 'N/A' },
          ]
        : [],
    },
  ];

  return (
    <MainLayout title="Profile">
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-accent-700 rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-display font-bold mb-1 truncate">
                  {user?.name || 'User'}
                </h1>
                <p className="text-white/90 text-sm sm:text-base truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost"
              onClick={() => navigate('/onboarding')}
              className="text-white hover:bg-white/20 border border-white/30 w-full md:w-auto"
            >
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Profile Sections */}
        {profileSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {section.data.length === 0 ? (
                <p className="text-neutral-600 text-center py-4">No data available</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {section.data.map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-neutral-600 mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-neutral-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                      {passwordSuccess}
                    </div>
                  )}
                  
                  {/* Current Password */}
                  <div>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        placeholder="Current Password"
                        value={passwordData.old_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, old_password: e.target.value })
                        }
                        disabled={passwordLoading}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-2.5 text-neutral-600 hover:text-neutral-900"
                      >
                        {showOldPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <div className="relative mb-2">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, new_password: e.target.value })
                        }
                        disabled={passwordLoading}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-neutral-600 hover:text-neutral-900"
                      >
                        {showNewPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    
                    {/* Password Rules */}
                    {passwordData.new_password && (
                      <div className="bg-neutral-50 p-3 rounded text-xs space-y-1">
                        <p className="font-semibold text-neutral-700">Password Requirements:</p>
                        <div className={passwordRules.length ? 'text-green-600' : 'text-red-600'}>
                          {passwordRules.length ? '✓' : '✗'} At least 6 characters
                        </div>
                        <div className={passwordRules.hasUpperCase ? 'text-green-600' : 'text-red-600'}>
                          {passwordRules.hasUpperCase ? '✓' : '✗'} One uppercase letter
                        </div>
                        <div className={passwordRules.hasLowerCase ? 'text-green-600' : 'text-red-600'}>
                          {passwordRules.hasLowerCase ? '✓' : '✗'} One lowercase letter
                        </div>
                        <div className={passwordRules.hasNumber ? 'text-green-600' : 'text-red-600'}>
                          {passwordRules.hasNumber ? '✓' : '✗'} One number
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirm_password: e.target.value })
                        }
                        disabled={passwordLoading}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-neutral-600 hover:text-neutral-900"
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {passwordData.confirm_password && passwordData.new_password && (
                      <div className="mt-2 text-xs">
                        {passwordData.new_password === passwordData.confirm_password ? (
                          <span className="text-green-600">✓ Passwords match</span>
                        ) : (
                          <span className="text-red-600">✗ Passwords do not match</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordError('');
                        setPasswordSuccess('');
                        setPasswordData({
                          old_password: '',
                          new_password: '',
                          confirm_password: '',
                        });
                        setShowOldPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      disabled={passwordLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={passwordLoading || !isNewPasswordValid}
                      className="flex-1"
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
