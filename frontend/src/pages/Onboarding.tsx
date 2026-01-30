import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';
import { useProfileStore } from '../store/profileStore';
import { useUniversitiesStore } from '../store/universitiesStore';
import { useOptionsStore } from '../store/optionsStore';
import { useAuth } from '../hooks/useAuth';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  COUNTRY_OPTIONS,
  EDUCATION_LEVELS,
  FUNDING_TYPES,
  EXAM_STATUSES,
} from '../lib/constants';

type FormData = {
  education_level: string;
  major: string;
  graduation_year: number;
  academic_score: string;
  target_degree: string;
  field: string;
  intake_year: number;
  countries: string[];
  budget_range: string;
  funding_type: string;
  ielts_status: string;
  gre_status: string;
  sop_status: string;
};

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  questionKey?: keyof FormData;
};

type QuestionOption = {
  value: string;
  label: string;
};

type QuestionFlowItem = {
  key: keyof FormData;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  options?: QuestionOption[];
  optional?: boolean;
};

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { completeOnboarding, updateProfile, isOnboardingComplete, dashboardData, isLoading, checkOnboardingStatus } = useProfileStore();
  const { invalidateCache: invalidateUniversitiesCache } = useUniversitiesStore();
  const { options, fetchOptions } = useOptionsStore();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [lastUserId, setLastUserId] = useState<number | null>(null);

  // Detect if we're in edit mode
  const isEditMode = isOnboardingComplete;

  // Fetch fresh onboarding status when user changes (new login)
  useEffect(() => {
    if (user && user.id !== lastUserId) {
      setLastUserId(user.id);
      checkOnboardingStatus(); // Force fresh check from backend
    }
  }, [user?.id, lastUserId]);

  // Load options from store (cached, won't make unnecessary API calls)
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Use cached options or fallback to defaults
  const availableFields = options?.field_options || [
    "Computer Science / IT",
    "Data Science / Analytics",
    "Engineering"
  ];

  const initialFormData = {
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
  };

  const [formData, setFormData] = useState(initialFormData);
  const [onboardingMode, setOnboardingMode] = useState<'form' | 'chat'>('form');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingQuestionKey, setEditingQuestionKey] = useState<keyof FormData | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const questionFlow: QuestionFlowItem[] = [
    {
      key: 'education_level',
      label: 'What is your current education level?',
      type: 'select',
      options: EDUCATION_LEVELS.map((level) => ({ value: level, label: level })),
    },
    {
      key: 'major',
      label: 'What is your current degree or major?',
      type: 'select',
      options: availableFields.map((field) => ({ value: field, label: field })),
    },
    {
      key: 'graduation_year',
      label: 'What is your graduation year?',
      type: 'number',
    },
    {
      key: 'academic_score',
      label: 'What is your GPA/percentage? (type "skip" to leave blank)',
      type: 'text',
      optional: true,
    },
    {
      key: 'target_degree',
      label: 'Which degree do you plan to pursue?',
      type: 'select',
      options: ["Bachelor's", "Master's", 'PhD'].map((degree) => ({
        value: degree,
        label: degree,
      })),
    },
    {
      key: 'field',
      label: 'What is your intended field of study?',
      type: 'select',
      options: availableFields.map((field) => ({ value: field, label: field })),
    },
    {
      key: 'intake_year',
      label: 'What is your target intake year?',
      type: 'number',
    },
    {
      key: 'countries',
      label: 'Which countries do you prefer? (comma separated)',
      type: 'multiselect',
      options: COUNTRY_OPTIONS.map((country) => ({ value: country, label: country })),
    },
    {
      key: 'budget_range',
      label: 'What is the maximum annual budget you can afford?',
      type: 'text',
    },
    {
      key: 'funding_type',
      label: 'How will you fund your studies?',
      type: 'select',
      options: FUNDING_TYPES.map((type) => ({ value: type, label: type })),
    },
    {
      key: 'ielts_status',
      label: 'What is your IELTS/TOEFL status?',
      type: 'select',
      options: EXAM_STATUSES.map((status) => ({ value: status, label: status })),
    },
    {
      key: 'gre_status',
      label: 'What is your GRE/GMAT status?',
      type: 'select',
      options: EXAM_STATUSES.map((status) => ({ value: status, label: status })),
    },
    {
      key: 'sop_status',
      label: 'What is your SOP status?',
      type: 'select',
      options: ['Not started', 'Draft', 'Completed'].map((status) => ({
        value: status,
        label: status,
      })),
    },
  ];

  const currentQuestion = questionFlow[currentQuestionIndex];

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

  useEffect(() => {
    if (onboardingMode !== 'chat') {
      return;
    }

    if (chatMessages.length === 0) {
      setCurrentQuestionIndex(0);
      const studentName = user?.name?.split(' ')[0] || 'there';
      const guidanceMessage = `Hey ${studentName}! 👋 I'm your AI Counsellor, and I'm here to help you find the perfect universities and guide you through your application journey. Let's start by understanding your academic background.`;
      setChatMessages([
        {
          id: 'intro',
          role: 'assistant',
          content: guidanceMessage,
        },
        {
          id: 'question-0',
          role: 'assistant',
          content: questionFlow[0].label,
        },
      ]);
    }
  }, [onboardingMode, chatMessages.length, questionFlow, user?.name]);

  useEffect(() => {
    if (onboardingMode !== 'chat') {
      return;
    }
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [chatMessages, onboardingMode]);

  useEffect(() => {
    if (onboardingMode !== 'chat') {
      return;
    }
    if (currentQuestion?.type === 'multiselect') {
      setSelectedCountries(formData.countries || []);
    } else {
      setSelectedCountries([]);
    }
  }, [currentQuestionIndex, onboardingMode, currentQuestion?.type, formData.countries]);

  const appendAssistantMessage = (content: string) => {
    setChatMessages((prev) => [
      ...prev,
      { id: `assistant-${Date.now()}`, role: 'assistant', content },
    ]);
  };

  const appendUserMessage = (content: string, questionKey?: keyof FormData) => {
    setChatMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content, questionKey },
    ]);
  };

  const applyAnswerToForm = (question: QuestionFlowItem, answer: string) => {
    const normalized = answer.trim();
    setFormData((prev) => {
      if (question.type === 'number') {
        const parsed = Number.parseInt(normalized, 10);
        return {
          ...prev,
          [question.key]: Number.isNaN(parsed) ? prev[question.key] : parsed,
        };
      }

      if (question.type === 'multiselect') {
        const tokens = normalized
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        const resolved = tokens
          .map((token) =>
            COUNTRY_OPTIONS.find(
              (country) => country.toLowerCase() === token.toLowerCase()
            ) || token
          )
          .filter(Boolean) as string[];

        return {
          ...prev,
          [question.key]: resolved,
        };
      }

      if (question.optional && normalized.toLowerCase() === 'skip') {
        return {
          ...prev,
          [question.key]: '',
        };
      }

      return {
        ...prev,
        [question.key]: normalized,
      };
    });
  };

  const getGuidanceMessage = (question: QuestionFlowItem, answer: string): string => {
    const messages: { [key: string]: string } = {
      education_level: `Great! Understanding your current level helps me recommend universities with the right programs for you.`,
      major: `${answer} is a solid foundation. Let's see where you want to take it next.`,
      graduation_year: `Perfect! Now I know your timeline. This is important for planning your applications.`,
      academic_score: `Excellent! Your academic performance is a key factor in finding the best fit universities.`,
      target_degree: `A ${answer} degree is a great choice. Let me find programs that match your aspirations.`,
      field: `${answer} is an exciting field! There are amazing opportunities out there for you.`,
      intake_year: `Got it! I'll focus on universities with intake in that year to match your timeline.`,
      countries: `Those are great choices! Different countries offer unique advantages for your field.`,
      budget_range: `Knowing your budget helps me find universities that are financially suitable for you.`,
      funding_type: `${answer} is a practical approach. Let me find universities with matching funding opportunities.`,
      ielts_status: `Your English exam status is crucial for international applications. We're on track!`,
      gre_status: `${answer}. This information helps in identifying universities that match your current progress.`,
      sop_status: `Your statement of purpose is a key document. I'll keep this in mind for recommendations.`,
    };
    return messages[question.key] || `That's helpful information!`;
  };

  const handleChatAnswer = (answer: string) => {
    if (!currentQuestion) {
      return;
    }

    appendUserMessage(answer, currentQuestion.key);
    applyAnswerToForm(currentQuestion, answer);

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setChatInput('');

    if (nextIndex < questionFlow.length) {
      const guidance = getGuidanceMessage(currentQuestion, answer);
      appendAssistantMessage(guidance);
      setTimeout(() => {
        appendAssistantMessage(questionFlow[nextIndex].label);
      }, 800);
    } else {
      const studentName = user?.name?.split(' ')[0] || 'there';
      appendAssistantMessage(
        `Awesome work, ${studentName}! 🎉 Your profile is complete. I'm now analyzing your information to find the perfect university matches for you. Let me prepare personalized recommendations and guidance tailored to your goals.`
      );
    }
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    if (editingMessageId && editingQuestionKey) {
      const question = questionFlow.find((item) => item.key === editingQuestionKey);
      if (question) {
        setChatMessages((prev) =>
          prev.map((message) =>
            message.id === editingMessageId
              ? { ...message, content: chatInput }
              : message
          )
        );
        applyAnswerToForm(question, chatInput);
      }
      setEditingMessageId(null);
      setEditingQuestionKey(null);
      setChatInput('');
      return;
    }

    handleChatAnswer(chatInput);
  };

  const handleCountryToggleChat = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((item) => item !== country)
        : [...prev, country]
    );
  };

  const handleCountryDone = () => {
    if (!selectedCountries.length) {
      appendAssistantMessage('Please select at least one country.');
      return;
    }
    handleChatAnswer(selectedCountries.join(', '));
  };

  const handleEditMessage = (message: ChatMessage) => {
    if (!message.questionKey) {
      return;
    }
    setEditingMessageId(message.id);
    setEditingQuestionKey(message.questionKey);
    setChatInput(message.content);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const handleChatKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleChatSubmit();
    }
  };

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
        navigate('/dashboard');
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
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              {isEditMode ? 'Edit Profile - Academic Background' : 'Academic Background'}
            </h2>
            
            <Select
              label="Current Education Level"
              name="education_level"
              value={formData.education_level}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select level' },
                ...EDUCATION_LEVELS.map(level => ({ value: level, label: level }))
              ]}
            />

            <Select
              label="Current Degree / Major"
              name="major"
              value={formData.major}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select your major' },
                ...availableFields.map(field => ({ value: field, label: field }))
              ]}
              helperText="Select from available field options"
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
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
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
                { value: 'PhD', label: 'PhD' },
              ]}
            />

            <Select
              label="Intended Field of Study"
              name="field"
              value={formData.field}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select intended field' },
                ...availableFields.map((field) => ({ value: field, label: field }))
              ]}
              helperText="Choose from the fields offered by universities"
            />

            <Input
              label="Target Intake Year"
              type="number"
              name="intake_year"
              value={formData.intake_year}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-3">
                Preferred Countries
              </label>
              <div className="grid grid-cols-2 gap-3">
                {COUNTRY_OPTIONS.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleCountryToggle(country)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.countries.includes(country)
                        ? 'border-primary-600 bg-primary-50 text-primary-800'
                        : 'border-neutral-200 hover:border-neutral-300'
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
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              {isEditMode ? 'Edit Profile - Budget & Funding' : 'Budget & Funding'}
            </h2>
            
            <Input
              label="Annual Budget"
              name="budget_range"
              value={formData.budget_range}
              onChange={handleChange}
              placeholder="Enter the maximum you can afford (e.g., 30000)"
            />

            <Select
              label="Funding Type"
              name="funding_type"
              value={formData.funding_type}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select funding type' },
                ...FUNDING_TYPES.map(type => ({ value: type, label: type }))
              ]}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              {isEditMode ? 'Edit Profile - Exams & Readiness' : 'Exams & Readiness'}
            </h2>
            
            <Select
              label="IELTS / TOEFL Status"
              name="ielts_status"
              value={formData.ielts_status}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select status' },
                ...EXAM_STATUSES.map(status => ({ value: status, label: status }))
              ]}
            />

            <Select
              label="GRE / GMAT Status"
              name="gre_status"
              value={formData.gre_status}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select status' },
                ...EXAM_STATUSES.map(status => ({ value: status, label: status }))
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
                { value: 'Completed', label: 'Completed' },
              ]}
            />

            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-700">
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AC
            </div>
            <span className="text-2xl font-display font-bold text-neutral-900">
              AI Counsellor
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Complete Your Profile</h1>
          <p className="text-neutral-600">
            {onboardingMode === 'form'
              ? `Step ${currentStep} of ${totalSteps}`
              : `Question ${Math.min(currentQuestionIndex + 1, questionFlow.length)} of ${questionFlow.length}`}
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setOnboardingMode('form')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                onboardingMode === 'form'
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setOnboardingMode('chat')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                onboardingMode === 'chat'
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              AI Chat
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar
            value={onboardingMode === 'form' ? currentStep : Math.min(currentQuestionIndex + 1, questionFlow.length)}
            max={onboardingMode === 'form' ? totalSteps : questionFlow.length}
            showLabel
            color="primary"
          />
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-md border border-neutral-100 p-8">
          {onboardingMode === 'form' ? (
            <>
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                )}
                
                {!isEditMode && currentStep === 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}

                {isEditMode && currentStep === 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    className="flex-1"
                  >
                    Cancel
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
            </>
          ) : (
            <div className="space-y-4">
              <div
                ref={chatContainerRef}
                className="h-[360px] sm:h-[420px] md:h-[480px] overflow-y-auto space-y-4 pr-1"
              >
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col gap-1 max-w-full ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                          message.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === 'user' && message.questionKey && (
                        <button
                          type="button"
                          onClick={() => handleEditMessage(message)}
                          className="text-[11px] px-2 py-1 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {currentQuestionIndex < questionFlow.length ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      placeholder={editingMessageId ? 'Edit your answer...' : 'Type your answer...'}
                      className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button type="button" onClick={handleChatSubmit} className="w-full sm:w-auto">
                      {editingMessageId ? 'Update' : 'Send'}
                    </Button>
                  </div>

                  {currentQuestion?.options && currentQuestion.options.length <= 8 && currentQuestion.type !== 'multiselect' && (
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleChatAnswer(option.value)}
                          className="px-3 py-1.5 text-xs rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQuestion?.type === 'multiselect' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {currentQuestion.options?.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleCountryToggleChat(option.value)}
                            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                              selectedCountries.includes(option.value)
                                ? 'bg-primary-600 text-white'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-neutral-500">
                          Select multiple and tap Done.
                        </p>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleCountryDone}
                          className="px-4 py-2 text-xs"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {!isEditMode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    )}

                    {isEditMode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/profile')}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    className="w-full"
                  >
                    {isEditMode ? 'Save Changes' : 'Complete Onboarding'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
