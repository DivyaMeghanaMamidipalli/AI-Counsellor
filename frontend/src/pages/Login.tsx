import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { useProfileStore } from '../store/profileStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const { checkOnboardingStatus } = useProfileStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  React.useEffect(() => {
    clearError();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await login(formData.email, formData.password);
      // Check if onboarding is completed
      const status = await checkOnboardingStatus();
      // ProtectedRoute will handle the redirect based on onboarding status
      navigate('/home');
    } catch (err) {
      // Error handled by store
    }
  };

  const handleGoogleLogin = () => {
    // Google login not yet implemented
    alert('Google Sign-in will be available soon. Please use email login for now.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nude-50 via-cream-50 to-sand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sand-600 to-nude-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AC
            </div>
            <span className="text-2xl font-display font-bold text-nude-900">
              AI Counsellor
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-nude-900 mb-2">Welcome Back</h1>
          <p className="text-nude-600">Sign in to continue your journey</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-soft-lg border border-nude-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium mb-2">Login failed</p>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-red-600 text-xs mt-2">
                  💡 Tip: Make sure your email and password are correct. If you don't have an account, please <Link to="/signup" className="underline font-semibold">sign up</Link>.
                </p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              placeholder="your.email@example.com"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              placeholder="Enter your password"
              autoComplete="current-password"
              showPasswordToggle={true}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-nude-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-nude-300 text-sand-700 focus:ring-sand-500"
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sand-700 hover:text-sand-800 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-nude-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-nude-600">Coming soon</span>
            </div>
          </div>

          {/* Social Login - Disabled */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleGoogleLogin}
            disabled
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google (Coming soon)</span>
          </Button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-nude-700">
          Don't have an account?{' '}
          <Link to="/signup" className="text-sand-700 hover:text-sand-800 font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
