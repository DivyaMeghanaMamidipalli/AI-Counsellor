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
    <div className="min-h-screen bg-gradient-to-br from-nude-50 via-cream-50 to-sand-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sand-600 to-nude-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AC
            </div>
            <span className="text-xl font-display font-bold text-nude-900">
              AI Counsellor
            </span>
          </div>
          
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
            <span className="px-4 py-2 bg-sand-100 text-sand-800 rounded-full text-sm font-medium">
              🎓 Your Personal Study Abroad Guide
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-nude-900 mb-6 leading-tight">
            Plan your study-abroad journey with a{' '}
            <span className="text-gradient">guided AI counsellor</span>
          </h1>
          
          <p className="text-lg md:text-xl text-nude-700 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop feeling confused. Get personalized guidance, university recommendations, and step-by-step application support powered by AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="primary" size="lg">
                Get Started Free
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Watch Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-soft border border-nude-100">
            <div className="w-12 h-12 bg-sand-100 rounded-xl flex items-center justify-center text-2xl mb-4">
              🧠
            </div>
            <h3 className="text-xl font-semibold text-nude-900 mb-3">
              AI-Powered Guidance
            </h3>
            <p className="text-nude-600 leading-relaxed">
              Get personalized recommendations based on your profile, goals, and preferences.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-soft border border-nude-100">
            <div className="w-12 h-12 bg-sand-100 rounded-xl flex items-center justify-center text-2xl mb-4">
              🎯
            </div>
            <h3 className="text-xl font-semibold text-nude-900 mb-3">
              Step-by-Step Process
            </h3>
            <p className="text-nude-600 leading-relaxed">
              Follow a structured journey from profile building to application submission.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-soft border border-nude-100">
            <div className="w-12 h-12 bg-sand-100 rounded-xl flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-xl font-semibold text-nude-900 mb-3">
              Smart Insights
            </h3>
            <p className="text-nude-600 leading-relaxed">
              Understand your chances, identify gaps, and make informed decisions.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-nude-900 text-center mb-12">
            How It Works
          </h2>
          
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Complete Your Profile',
                description: 'Share your academic background, goals, budget, and exam readiness.',
              },
              {
                step: '2',
                title: 'Get AI Recommendations',
                description: 'Receive personalized university suggestions categorized by fit level.',
              },
              {
                step: '3',
                title: 'Lock Your Strategy',
                description: 'Commit to your top choices and receive focused guidance.',
              },
              {
                step: '4',
                title: 'Execute With Confidence',
                description: 'Follow actionable tasks and prepare your applications step by step.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sand-600 to-nude-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-nude-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-nude-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-sand-700 to-nude-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join thousands of students who found clarity in their study abroad plans.
          </p>
          <Link to="/signup">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-sand-800 hover:bg-nude-50"
            >
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-nude-200 py-8">
        <div className="container mx-auto px-4 text-center text-nude-600 text-sm">
          <p>© 2026 AI Counsellor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
