import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';
import { useProfileStore } from '../store/profileStore';
import { useUniversitiesStore } from '../store/universitiesStore';
import { ProgressBar } from '../components/common/ProgressBar';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding, updateProfile, isOnboardingComplete, dashboardData, isLoading } = useProfileStore();
  const { invalidateCache: invalidateUniversitiesCache } = useUniversitiesStore();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Detect if we're in edit mode
  const isEditMode = isOnboardingComplete;

  const [formData, setFormData] = useState({
    // Academic Background
    education_level: '',
    major: '',
    graduation_year: new Date().getFullYear(),
    academic_score: '',

    // Study Goals
    target_degree: '',
    field: '',
    intake_year: new Date().getFullYear() + 1,
    countries: [] as string[],

    // Budget
    budget_range: '',
    funding_type: '',

    // Exams & Readiness
    ielts_status: '',
    gre_status: '',
    sop_status: '',
  });

  // Pre-fill form data when in edit mode
  useEffect(() => {
    if (isEditMode && dashboardData?.profile) {
      const profile = dashboardData.profile;
      setFormData({
        education_level: profile.education_level || '',
        major: profile.major || '',
        graduation_year: profile.graduation_year || new Date().getFullYear(),
        academic_score: profile.academic_score || '',
        target_degree: profile.target_degree || '',
        field: profile.field || '',
        intake_year: profile.intake_year || new Date().getFullYear() + 1,
        countries: profile.countries || [],
        budget_range: profile.budget_range || '',
        funding_type: profile.funding_type || '',
        ielts_status: profile.ielts_status || '',
        gre_status: profile.gre_status || '',
        sop_status: profile.sop_status || '',
      });
    }
  }, [isEditMode, dashboardData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryToggle = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter((c) => c !== country)
        : [...prev.countries, country],
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        graduation_year: parseInt(formData.graduation_year.toString()),
        intake_year: parseInt(formData.intake_year.toString()),
      };

      if (isEditMode) {
        // Update existing profile
        await updateProfile(payload);
        // Invalidate universities cache since profile changed
        invalidateUniversitiesCache();
        navigate('/profile');
      } else {
        // Complete initial onboarding
        await completeOnboarding(payload);
        navigate('/home');
      }
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-nude-900 mb-6">
              {isEditMode ? 'Edit Profile - Academic Background' : 'Academic Background'}
            </h2>
            
            <Select
              label="Current Education Level"
              name="education_level"
              value={formData.education_level}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select level' },
                { value: 'High School', label: 'High School' },
                { value: 'Undergraduate', label: 'Undergraduate' },
                { value: 'Graduate', label: 'Graduate' },
                { value: 'Postgraduate', label: 'Postgraduate' },
              ]}
            />

            <Input
              label="Degree / Major"
              name="major"
              value={formData.major}
              onChange={handleChange}
              placeholder="e.g., Computer Science, Business Administration"
            />

            <Input
              label="Graduation Year"
              type="number"
              name="graduation_year"
              value={formData.graduation_year}
              onChange={handleChange}
              placeholder="2024"
            />

            <Input
              label="GPA / Percentage (Optional)"
              name="academic_score"
              value={formData.academic_score}
              onChange={handleChange}
              placeholder="e.g., 3.8 or 85%"
              helperText="Your academic performance"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-nude-900 mb-6">
              {isEditMode ? 'Edit Profile - Study Goals' : 'Study Goals'}
            </h2>
            
            <Select
              label="Intended Degree"
              name="target_degree"
              value={formData.target_degree}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select degree' },
                { value: "Bachelor's", label: "Bachelor's" },
                { value: "Master's", label: "Master's" },
                { value: 'MBA', label: 'MBA' },
                { value: 'PhD', label: 'PhD' },
              ]}
            />

            <Input
              label="Field of Study"
              name="field"
              value={formData.field}
              onChange={handleChange}
              placeholder="e.g., Data Science, International Business"
            />

            <Input
              label="Target Intake Year"
              type="number"
              name="intake_year"
              value={formData.intake_year}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-medium text-nude-800 mb-3">
                Preferred Countries
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Singapore'].map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleCountryToggle(country)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.countries.includes(country)
                        ? 'border-sand-600 bg-sand-50 text-sand-800'
                        : 'border-nude-200 hover:border-nude-300'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-nude-900 mb-6">
              {isEditMode ? 'Edit Profile - Budget & Funding' : 'Budget & Funding'}
            </h2>
            
            <Input
              label="Budget Range"
              name="budget_range"
              value={formData.budget_range}
              onChange={handleChange}
              placeholder="e.g., 10000-50000 USD per year"
            />

            <Select
              label="Funding Type"
              name="funding_type"
              value={formData.funding_type}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select funding type' },
                { value: 'Self-funded', label: 'Self-funded' },
                { value: 'Scholarship-dependent', label: 'Scholarship-dependent' },
                { value: 'Loan-dependent', label: 'Loan-dependent' },
                { value: 'Mixed', label: 'Mixed (Multiple sources)' },
              ]}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-nude-900 mb-6">
              {isEditMode ? 'Edit Profile - Exams & Readiness' : 'Exams & Readiness'}
            </h2>
            
            <Select
              label="IELTS / TOEFL Status"
              name="ielts_status"
              value={formData.ielts_status}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select status' },
                { value: 'Not started', label: 'Not started' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Not required', label: 'Not required' },
              ]}
            />

            <Select
              label="GRE / GMAT Status"
              name="gre_status"
              value={formData.gre_status}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select status' },
                { value: 'Not started', label: 'Not started' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Not required', label: 'Not required' },
              ]}
            />

            <Select
              label="Statement of Purpose (SOP) Status"
              name="sop_status"
              value={formData.sop_status}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select status' },
                { value: 'Not started', label: 'Not started' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Ready', label: 'Ready' },
              ]}
            />

            <div className="mt-6 p-4 bg-cream-50 rounded-lg border border-cream-200">
              <p className="text-sm text-nude-700">
                🎯 <strong>Almost done!</strong> This information will help us provide personalized university recommendations and guidance tailored to your profile.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nude-50 via-cream-50 to-sand-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sand-600 to-nude-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AC
            </div>
            <span className="text-2xl font-display font-bold text-nude-900">
              AI Counsellor
            </span>
          </div>
          <h1 className="text-2xl font-bold text-nude-900 mb-2">Complete Your Profile</h1>
          <p className="text-nude-600">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar
            value={currentStep}
            max={totalSteps}
            showLabel
            color="sand"
          />
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-soft-lg border border-nude-100 p-8">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/profile')}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            
            {currentStep > 1 && !isEditMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                isLoading={isLoading}
                className="flex-1"
              >
                {isEditMode ? 'Save Changes' : 'Complete Onboarding'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
