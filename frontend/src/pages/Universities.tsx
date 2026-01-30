import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/Loading';
import { University } from '../api/universities';
import { useProfileStore } from '../store/profileStore';
import { useUniversitiesStore } from '../store/universitiesStore';

export const Universities: React.FC = () => {
  const location = useLocation();
  const {
    recommendations,
    shortlisted,
    locked,
    isLoading,
    fetchAll,
    shortlistUniversity,
    lockUniversity,
    unlockUniversity,
    removeFromShortlist,
  } = useUniversitiesStore();
  const { fetchDashboard, invalidateCache: invalidateProfileCache } = useProfileStore();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'shortlisted' | 'locked'>('recommendations');

  useEffect(() => {
    fetchAll(); // Will use cache if available
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'recommendations' || tab === 'shortlisted' || tab === 'locked') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleShortlist = async (universityId: number) => {
    try {
      await shortlistUniversity(universityId);
    } catch (error) {
      console.error('Failed to shortlist:', error);
    }
  };

  const handleLock = async (universityId: number) => {
    try {
      await lockUniversity(universityId);
      invalidateProfileCache(); // Invalidate profile cache
      await fetchDashboard(true); // Force refresh dashboard to update stage
    } catch (error) {
      console.error('Failed to lock:', error);
    }
  };

  const handleUnlock = async (universityId: number) => {
    try {
      const shouldUnlock = window.confirm(
        'Unlocking a university signals a change in commitment. You can unlock later if needed, but do it intentionally to stay focused.\n\nDo you want to continue?'
      );
      if (!shouldUnlock) {
        return;
      }

      const warning = await unlockUniversity(universityId);
      if (warning) {
        window.alert(warning);
      }
      invalidateProfileCache(); // Invalidate profile cache
      await fetchDashboard(true); // Force refresh dashboard to update stage
    } catch (error) {
      console.error('Failed to unlock:', error);
    }
  };

  const handleRemove = async (universityId: number) => {
    try {
      await removeFromShortlist(universityId);
    } catch (error) {
      console.error('Failed to remove:', error);
    }
  };

  const getCostBadgeVariant = (level: string) => {
    return level === 'Low' ? 'success' : level === 'Medium' ? 'warning' : 'danger';
  };

  const isUniversityShortlisted = (universityId: number) => {
    return shortlisted.some(uni => uni.id === universityId) || locked.some(uni => uni.id === universityId);
  };

  const getChanceBadgeVariant = (chance: string) => {
    return chance === 'High' ? 'success' : chance === 'Medium' ? 'warning' : 'info';
  };

  const getRiskBadgeVariant = (risk: string) => {
    return risk === 'Low' ? 'success' : risk === 'Medium' ? 'warning' : 'danger';
  };

  const renderUniversityCard = (university: University, context: 'recommendations' | 'shortlisted' | 'locked' = 'recommendations') => (
    <Card key={university.id} hover>
      <CardContent>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-nude-900 mb-1">{university.name}</h3>
              {university.locked && (
                <Badge variant="warning" size="sm">
                  🔒 Locked
                </Badge>
              )}
            </div>
            <p className="text-sm text-nude-600">{university.country}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-nude-600 mb-1">Acceptance Likelihood</p>
            <Badge variant={getChanceBadgeVariant(university.acceptance_likelihood || 'Medium')} size="sm">
              {university.acceptance_likelihood || 'Medium'}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-nude-600 mb-1">Average Cost</p>
            <Badge variant={university.avg_cost < 20000 ? 'success' : university.avg_cost < 40000 ? 'warning' : 'danger'} size="sm">
              ${(university.avg_cost / 1000).toFixed(0)}K
            </Badge>
            {university.cost_fit && (
              <p className="text-[10px] text-nude-500 mt-1">Cost fit: {university.cost_fit}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-nude-600 mb-1">Risk Level</p>
          <Badge variant={getRiskBadgeVariant(university.risk_level || 'Medium')} size="sm">
            {university.risk_level || 'Medium'}
          </Badge>
        </div>

        <div className="mb-4">
          <p className="text-xs text-nude-600 mb-1">Fields Offered</p>
          <p className="text-sm text-nude-900">
            {university.fields?.join(', ') || 'Not specified'}
          </p>
        </div>

        <div className="flex gap-2">
          {context === 'recommendations' && (
            <>
              {isUniversityShortlisted(university.id) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(university.id)}
                  className="flex-1"
                >
                  Remove from Shortlist
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleShortlist(university.id)}
                  className="flex-1"
                >
                  Shortlist
                </Button>
              )}
            </>
          )}
          
          {context === 'shortlisted' && (
            <>
              {university.locked ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnlock(university.id)}
                  className="flex-1"
                >
                  Unlock
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLock(university.id)}
                  className="flex-1"
                >
                  Lock
                </Button>
              )}
              {!university.locked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(university.id)}
                  className="flex-1"
                >
                  Remove
                </Button>
              )}
            </>
          )}
          
          {context === 'locked' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleUnlock(university.id)}
              className="flex-1"
            >
              Unlock
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <MainLayout title="Universities">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading universities..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Universities">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-nude-200">
          {[
            { key: 'recommendations', label: 'Recommendations', count: 0 },
            { key: 'shortlisted', label: 'Shortlisted', count: shortlisted.length },
            { key: 'locked', label: 'Locked', count: locked.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-sand-700 text-sand-700'
                  : 'border-transparent text-nude-600 hover:text-nude-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-nude-200 text-nude-800 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'recommendations' && recommendations && (
          <div className="space-y-8">
            {/* Dream Universities */}
            {recommendations.dream && recommendations.dream.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-sand-700 mb-1">🌟 Dream Universities</h2>
                  <p className="text-sm text-nude-600">Reach goals - higher competition or cost. Requires strong preparation.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.dream.map((uni) => renderUniversityCard(uni, 'recommendations'))}
                </div>
              </div>
            )}

            {/* Target Universities */}
            {recommendations.target && recommendations.target.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-sand-700 mb-1">🎯 Target Universities</h2>
                  <p className="text-sm text-nude-600">Well-matched options - balanced opportunity with reasonable effort.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.target.map((uni) => renderUniversityCard(uni, 'recommendations'))}
                </div>
              </div>
            )}

            {/* Safe Universities */}
            {recommendations.safe && recommendations.safe.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-sand-700 mb-1">🛟 Safe Universities</h2>
                  <p className="text-sm text-nude-600">Strong match - your profile aligns well, high acceptance likelihood.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.safe.map((uni) => renderUniversityCard(uni, 'recommendations'))}
                </div>
              </div>
            )}

            {/* No recommendations */}
            {(!recommendations.dream || recommendations.dream.length === 0) &&
             (!recommendations.target || recommendations.target.length === 0) &&
             (!recommendations.safe || recommendations.safe.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-nude-600 mb-4">No universities match your criteria. Try adjusting your preferences.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shortlisted' && (
          <div>
            {shortlisted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-nude-600 mb-4">No universities shortlisted yet</p>
                <Button variant="primary" onClick={() => setActiveTab('recommendations')}>
                  View Recommendations
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shortlisted.map((uni) => renderUniversityCard(uni, 'shortlisted'))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'locked' && (
          <div>
            {locked.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-nude-600 mb-4">No universities locked yet</p>
                <Button variant="primary" onClick={() => setActiveTab('shortlisted')}>
                  View Shortlisted
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locked.map((uni) => renderUniversityCard(uni, 'locked'))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
