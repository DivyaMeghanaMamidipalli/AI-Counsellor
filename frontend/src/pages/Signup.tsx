import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  React.useEffect(() => {
    clearError();
  }, []);

  const validatePassword = (pwd: string) => {
    const requirements = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(Boolean);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    
    // Real-time password validation
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const validate = () => {
    const errors = { name: '', email: '', password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
      isValid = false;
    }

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
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password does not meet requirements';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await signup(formData.name, formData.email, formData.password);
      // After signup, user needs to complete onboarding
      navigate('/onboarding');
    } catch (err: any) {
      // Error is handled by the store, but we can add extra handling if needed
      console.error('Signup error:', err);
    }
  };

  const handleGoogleSignup = () => {
    // Google signup not yet implemented
    alert('Google Sign-up will be available soon. Please use email signup for now.');
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
          <h1 className="text-2xl font-bold text-nude-900 mb-2">Create Your Account</h1>
          <p className="text-nude-600">Start your study abroad journey today</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-soft-lg border border-nude-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium mb-2">Signup failed</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              placeholder="John Doe"
              autoComplete="name"
            />

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

            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                placeholder="Create a strong password"
                autoComplete="new-password"
                showPasswordToggle={true}
              />
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 p-3 bg-nude-50 rounded-lg border border-nude-200">
                  <p className="text-xs font-medium text-nude-700 mb-2">Password Requirements:</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                        passwordRequirements.minLength ? 'bg-green-500' : 'bg-nude-300'
                      }`}>
                        {passwordRequirements.minLength ? '✓' : '○'}
                      </span>
                      <span className="text-xs text-nude-600">At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                        passwordRequirements.hasUppercase ? 'bg-green-500' : 'bg-nude-300'
                      }`}>
                        {passwordRequirements.hasUppercase ? '✓' : '○'}
                      </span>
                      <span className="text-xs text-nude-600">One uppercase letter (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                        passwordRequirements.hasLowercase ? 'bg-green-500' : 'bg-nude-300'
                      }`}>
                        {passwordRequirements.hasLowercase ? '✓' : '○'}
                      </span>
                      <span className="text-xs text-nude-600">One lowercase letter (a-z)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                        passwordRequirements.hasNumber ? 'bg-green-500' : 'bg-nude-300'
                      }`}>
                        {passwordRequirements.hasNumber ? '✓' : '○'}
                      </span>
                      <span className="text-xs text-nude-600">One number (0-9)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              placeholder="Confirm your password"
              autoComplete="new-password"
              showPasswordToggle={true}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Create Account
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

          {/* Social Signup - Disabled */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleGoogleSignup}
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
            <span>Sign up with Google (Coming soon)</span>
          </Button>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-nude-700">
          Already have an account?{' '}
          <Link to="/login" className="text-sand-700 hover:text-sand-800 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
