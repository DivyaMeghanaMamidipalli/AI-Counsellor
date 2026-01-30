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

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    
    // More robust email validation pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    // Check for common typos in popular domains
    const commonDomainTypos: { [key: string]: string } = {
      'gmial.com': 'Did you mean gmail.com?',
      'gmai.com': 'Did you mean gmail.com?',
      'yahooo.com': 'Did you mean yahoo.com?',
      'outlok.com': 'Did you mean outlook.com?',
      'hotmial.com': 'Did you mean hotmail.com?',
    };
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && commonDomainTypos[domain]) {
      return commonDomainTypos[domain];
    }
    
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    const emailError = validateEmail(formData.email);
    if (emailError) {
      errors.email = emailError;
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
      navigate('/dashboard');
    } catch (err) {
      // Error handled by store
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AC
            </div>
            <span className="text-2xl font-display font-bold text-neutral-900">
              AI Counsellor
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
          <p className="text-neutral-600">Sign in to continue your journey</p>
          <div className="mt-3">
            <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-800">
              ← Back to landing
            </Link>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-md border border-neutral-100 p-8">
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
              <label className="flex items-center gap-2 text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary-700 hover:text-primary-800 font-medium">
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
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-neutral-700">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-700 hover:text-primary-800 font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
