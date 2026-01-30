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
    allUniversities,
    isLoading,
    fetchAll,
    fetchAllUniversities,
    shortlistUniversity,
    lockUniversity,
    unlockUniversity,
    removeFromShortlist,
  } = useUniversitiesStore();
  const { fetchDashboard, invalidateCache: invalidateProfileCache } = useProfileStore();
  const [activeTab, setActiveTab] = useState<'all' | 'recommendations' | 'shortlisted' | 'locked'>('recommendations');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [universityToUnlock, setUniversityToUnlock] = useState<number | null>(null);

  useEffect(() => {
    fetchAll(); // Will use cache if available
    fetchAllUniversities(); // Fetch all universities
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'all' || tab === 'recommendations' || tab === 'shortlisted' || tab === 'locked') {
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
    setUniversityToUnlock(universityId);
    setShowUnlockModal(true);
  };

  const confirmUnlock = async () => {
    if (!universityToUnlock) return;

    try {
      await unlockUniversity(universityToUnlock);
      invalidateProfileCache(); // Invalidate profile cache
      await fetchDashboard(true); // Force refresh dashboard to update stage
    } catch (error) {
      console.error('Failed to unlock:', error);
    } finally {
      setShowUnlockModal(false);
      setUniversityToUnlock(null);
    }
  };

  const cancelUnlock = () => {
    setShowUnlockModal(false);
    setUniversityToUnlock(null);
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

  const isUniversityLocked = (universityId: number) => {
    return locked.some(uni => uni.id === universityId);
  };

  const isUniversityRecommended = (universityId: number) => {
    if (!recommendations) return false;
    return [
      ...recommendations.dream,
      ...recommendations.target,
      ...recommendations.safe
    ].some(uni => uni.id === universityId);
  };

  const getChanceBadgeVariant = (chance: string) => {
    return chance === 'High' ? 'success' : chance === 'Medium' ? 'warning' : 'info';
  };

  const getRiskBadgeVariant = (risk: string) => {
    return risk === 'Low' ? 'success' : risk === 'Medium' ? 'warning' : 'danger';
  };

  const renderUniversityCard = (university: University, context: 'all' | 'recommendations' | 'shortlisted' | 'locked' = 'recommendations', showRecommendedBadge = false) => (
    <Card key={university.id} hover>
      <CardContent>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-nude-900 mb-1">{university.name}</h3>
              {showRecommendedBadge && isUniversityRecommended(university.id) && (
                <Badge variant="warning" size="sm">
                  👑 Recommended
                </Badge>
              )}
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
          {(context === 'recommendations' || context === 'all') && (
            <>
              {isUniversityLocked(university.id) ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnlock(university.id)}
                  className="flex-1"
                >
                  Unlock
                </Button>
              ) : isUniversityShortlisted(university.id) ? (
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
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleLock(university.id)}
                    className="flex-1"
                  >
                    Lock
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(university.id)}
                    className="flex-1"
                  >
                    Remove
                  </Button>
                </>
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

  const allUniversitiesList = allUniversities.map((uni) => renderUniversityCard(uni, 'all', true));

  const dreamList = recommendations?.dream?.map((uni) => renderUniversityCard(uni, 'recommendations')) || [];
  const targetList = recommendations?.target?.map((uni) => renderUniversityCard(uni, 'recommendations')) || [];
  const safeList = recommendations?.safe?.map((uni) => renderUniversityCard(uni, 'recommendations')) || [];

  const shortlistedList = shortlisted.map((uni) => renderUniversityCard(uni, 'shortlisted'));
  const lockedList = locked.map((uni) => renderUniversityCard(uni, 'locked'));

  if (isLoading && !recommendations && !shortlisted.length && !locked.length) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-nude-900 mb-2">Universities</h1>
          <p className="text-nude-600">
            Explore recommended universities, manage your shortlist, and lock your final choices
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-nude-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'all'
                ? 'border-sand-500 text-sand-700'
                : 'border-transparent text-nude-600 hover:text-nude-900'
            }`}
          >
            All Universities
            <span className="ml-2 text-xs bg-nude-100 px-2 py-1 rounded-full">
              {allUniversities.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'recommendations'
                ? 'border-sand-500 text-sand-700'
                : 'border-transparent text-nude-600 hover:text-nude-900'
            }`}
          >
            Recommendations
            <span className="ml-2 text-xs bg-nude-100 px-2 py-1 rounded-full">
              {(recommendations?.dream?.length || 0) + (recommendations?.target?.length || 0) + (recommendations?.safe?.length || 0)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('shortlisted')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'shortlisted'
                ? 'border-sand-500 text-sand-700'
                : 'border-transparent text-nude-600 hover:text-nude-900'
            }`}
          >
            Shortlisted
            <span className="ml-2 text-xs bg-nude-100 px-2 py-1 rounded-full">
              {shortlisted.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('locked')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'locked'
                ? 'border-sand-500 text-sand-700'
                : 'border-transparent text-nude-600 hover:text-nude-900'
            }`}
          >
            Locked
            <span className="ml-2 text-xs bg-nude-100 px-2 py-1 rounded-full">
              {locked.length}
            </span>
          </button>
        </div>

        {/* All Universities Tab */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allUniversitiesList.length > 0 ? (
              allUniversitiesList
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-nude-600">No universities found</p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div>
            {dreamList.length === 0 && targetList.length === 0 && safeList.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-sand-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🎓</span>
                </div>
                <h3 className="text-xl font-semibold text-nude-900 mb-2">No Recommendations Yet</h3>
                <p className="text-nude-600 mb-6">
                  Complete your profile to get personalized university recommendations
                </p>
              </div>
            ) : (
              <>
                {dreamList.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-nude-900 mb-4 flex items-center gap-2">
                      <span>🌟</span> Dream Universities
                    </h2>
                    <p className="text-sm text-nude-600 mb-4">
                      Highly competitive, reach for the stars
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dreamList}
                    </div>
                  </div>
                )}
                {targetList.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-nude-900 mb-4 flex items-center gap-2">
                      <span>🎯</span> Target Universities
                    </h2>
                    <p className="text-sm text-nude-600 mb-4">
                      Well-matched, balanced opportunity
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {targetList}
                    </div>
                  </div>
                )}
                {safeList.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-nude-900 mb-4 flex items-center gap-2">
                      <span>✅</span> Safe Universities
                    </h2>
                    <p className="text-sm text-nude-600 mb-4">
                      Strong match, high acceptance likelihood
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {safeList}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Shortlisted Tab */}
        {activeTab === 'shortlisted' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortlistedList.length > 0 ? (
              shortlistedList
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-sand-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold text-nude-900 mb-2">No Shortlisted Universities</h3>
                <p className="text-nude-600">
                  Start shortlisting universities from recommendations
                </p>
              </div>
            )}
          </div>
        )}

        {/* Locked Tab */}
        {activeTab === 'locked' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedList.length > 0 ? (
              lockedList
            ) : (
              <div className="col-span-full">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-semibold text-nude-900 mb-2">No Locked Universities</h3>
                  <p className="text-nude-600 mb-6 text-center">
                    You have no locked universities. Please lock at least one to proceed with applications.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unlock Confirmation Modal */}
        {showUnlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
              onClick={cancelUnlock}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔓</span>
                </div>
                <h3 className="text-xl font-semibold text-nude-900 mb-2">
                  Unlock University?
                </h3>
                <p className="text-nude-600">
                  This will move the university back to your shortlist. You can lock it again later.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={cancelUnlock}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmUnlock}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  Unlock
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
