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

    const emailError = validateEmail(formData.email);
    if (emailError) {
      errors.email = emailError;
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
      navigate('/dashboard');
    } catch (err: any) {
      // Error is handled by the store, but we can add extra handling if needed
      console.error('Signup error:', err);
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
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Create Your Account</h1>
          <p className="text-neutral-600">Start your study abroad journey today</p>
          <div className="mt-3">
            <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-800">
              ← Back to landing
            </Link>
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-md border border-neutral-100 p-8">
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
                <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-xs font-medium text-neutral-700 mb-2">Password Requirements:</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                        passwordRequirements.minLength ? 'bg-green-500' : 'bg-neutral-300'
                      }`}>
                        {passwordRequirements.minLength ? '✓' : '○'}
                      </span>
                      <span className="text-xs text-neutral-600">At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                        passwordRequirements.hasUppercase ? 'bg-green-500' : 'bg-neutral-300'
                      }`}>
                        {passwordRequirements.hasUppercase ? '✓' : '○'}
                      </span>
                      <span className="text-xs text-neutral-600">One uppercase letter (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                        passwordRequirements.hasLowercase ? 'bg-green-500' : 'bg-neutral-300'
                      }`}>
                        {passwordRequirements.hasLowercase ? '✓' : '○'}
                      </span>
                      <span className="text-xs text-neutral-600">One lowercase letter (a-z)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                        passwordRequirements.hasNumber ? 'bg-green-500' : 'bg-neutral-300'
                      }`}>
                        {passwordRequirements.hasNumber ? '✓' : '○'}
                      </span>
                      <span className="text-xs text-neutral-600">One number (0-9)</span>
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

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-primary-700 hover:text-primary-800 font-medium text-sm">
              Forgot password?
            </Link>
          </div>

          {/* Login Link */}
          <p className="text-center mt-6 text-neutral-700">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 hover:text-primary-800 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
