import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { authApi } from '../api/auth';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) return 'Password is required';
    if (newPassword.length < 6) return 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const passwordError = validatePasswords();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await authApi.resetPassword({ email, new_password: newPassword });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AC
            </div>
            <span className="text-2xl font-display font-bold text-neutral-900">
              AI Counsellor
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Reset your password</h1>
          <p className="text-neutral-600">Enter your email and set a new password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-neutral-100 p-8">
          {done ? (
            <div className="text-center space-y-3">
              <p className="text-neutral-800 font-semibold">Password updated</p>
              <p className="text-sm text-neutral-600">You can now sign in with your new password.</p>
              <Link to="/login" className="text-primary-700 hover:text-primary-800 font-semibold">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                error={error}
                placeholder="your.email@example.com"
                autoComplete="email"
              />
              <Input
                label="New password"
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                error={error}
                placeholder="Enter new password"
                autoComplete="new-password"
                showPasswordToggle={true}
              />
              <Input
                label="Confirm password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                error={error}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                showPasswordToggle={true}
              />
              <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
                Update password
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6 space-y-2">
          <Link to="/" className="text-neutral-600 hover:text-neutral-800 text-sm">
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
};
