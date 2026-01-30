import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-accent-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AC
            </div>
            <span className="text-xl font-display font-bold text-neutral-900">
              AI Counsellor
            </span>
          </Link>
          
          <Link to="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              🎓 Your Personal Study Abroad Guide
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-neutral-900 mb-6 leading-tight">
            Plan your study-abroad journey with a{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">guided AI counsellor</span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-700 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop feeling confused. Get personalized guidance, university recommendations, and step-by-step application support powered by AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Everything You Need Section */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-neutral-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-neutral-200 text-lg max-w-2xl mx-auto">
              Our comprehensive platform combines AI technology with expert knowledge to guide you through your entire study abroad journey.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-primary-800/50 to-neutral-800/50 backdrop-blur-sm border border-primary-600/30 p-6 rounded-xl hover:border-primary-400/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                AI-Powered Guidance
              </h3>
              <p className="text-neutral-200 text-sm leading-relaxed">
                Get personalized recommendations from our intelligent assistant that understands your unique profile and goals.
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary-800/50 to-neutral-800/50 backdrop-blur-sm border border-primary-600/30 p-6 rounded-xl hover:border-primary-400/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Global University Database
              </h3>
              <p className="text-neutral-200 text-sm leading-relaxed">
                Access comprehensive information on universities across USA, UK, Canada, Australia, Germany, and more.
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary-800/50 to-neutral-800/50 backdrop-blur-sm border border-primary-600/30 p-6 rounded-xl hover:border-primary-400/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Profile-Based Matching
              </h3>
              <p className="text-neutral-200 text-sm leading-relaxed">
                Discover universities that match your academic background, budget, and career aspirations perfectly.
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary-800/50 to-neutral-800/50 backdrop-blur-sm border border-primary-600/30 p-6 rounded-xl hover:border-primary-400/50 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Application Management
              </h3>
              <p className="text-neutral-200 text-sm leading-relaxed">
                Track deadlines, manage documents, and stay organized throughout your application journey.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Journey Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-4">
              Your Journey in 4 Simple Stages
            </h2>
            <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
              Our structured approach ensures you never miss a step in your application process.
            </p>
          </div>
          
          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" style={{transform: 'translateY(-50%)'}}></div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {[
                {
                  step: '1',
                  title: 'Build Your Profile',
                  description: 'Share your academic background, test scores, and preferences.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  step: '2',
                  title: 'Discover Universities',
                  description: 'Explore AI-curated universities matching your profile and goals.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ),
                },
                {
                  step: '3',
                  title: 'Shortlist & Lock',
                  description: 'Create your personalized list and commit to your top choices.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  ),
                },
                {
                  step: '4',
                  title: 'Apply with Confidence',
                  description: 'Get guided through every step of the application process.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.step} className="text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full text-white font-bold text-2xl mb-4 shadow-lg relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full animate-pulse opacity-50"></div>
                    <span className="relative z-10">{item.step}</span>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md border border-neutral-100 min-h-[180px]">
                    <div className="flex justify-center mb-3 text-primary-600">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary-700 to-accent-700 rounded-3xl p-12 md:p-16 text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6 leading-tight">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who found clarity in their study abroad plans.
            </p>
            <div className="flex justify-center">
              <Link to="/signup">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary-800 hover:bg-neutral-50 font-semibold px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="container mx-auto px-4 text-center text-neutral-600 text-sm">
          <p>© 2026 AI Counsellor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
