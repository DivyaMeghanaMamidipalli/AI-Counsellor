import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/Loading';
import { University } from '../api/universities';
import { useProfileStore } from '../store/profileStore';
import { useUniversitiesStore } from '../store/universitiesStore';
import { useAuth } from '../hooks/useAuth';

export const Universities: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
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
  const [lastUserId, setLastUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [acceptanceLikelihoodFilter, setAcceptanceLikelihoodFilter] = useState<'all' | 'safe' | 'target' | 'dream'>('all');

  useEffect(() => {
    // Force fresh fetch if user changed (new login)
    if (user && user.id !== lastUserId) {
      setLastUserId(user.id);
      fetchAll(true); // Force refresh with new user
      fetchAllUniversities();
    }
  }, [user?.id, lastUserId]);

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
      ...recommendations.safe,
    ].some(uni => uni.id === universityId);
  };

  const getChanceBadgeVariant = (chance: string) => {
    return chance === 'High' ? 'success' : chance === 'Medium' ? 'warning' : 'info';
  };

  const getRiskBadgeVariant = (risk: string) => {
    return risk === 'Low' ? 'success' : risk === 'Medium' ? 'warning' : 'danger';
  };

  const getCategoryBadgeVariant = (category?: string | null) => {
    if (category === 'Safe') return 'success';
    if (category === 'Target') return 'info';
    if (category === 'Dream') return 'warning';
    return 'default';
  };

  const getRiskLabel = (risk?: string) => {
    if (risk === 'Low') return 'Easy';
    if (risk === 'Medium') return 'Less Risky';
    if (risk === 'High') return 'Risky';
    return 'Less Risky';
  };

  const renderUniversityCard = (university: University, context: 'all' | 'recommendations' | 'shortlisted' | 'locked' = 'recommendations') => {
    const showScoring = context !== 'all';

    return (
      <Card key={university.id} hover>
        <CardContent>
          <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-semibold text-neutral-900 mb-1 line-clamp-2">{university.name}</h3>
              {university.category && (
                <Badge variant={getCategoryBadgeVariant(university.category)} size="sm">
                  {university.category}
                </Badge>
              )}
              {context === 'all' && isUniversityRecommended(university.id) && (
                <Badge variant="warning" size="sm">
                  👑
                </Badge>
              )}
              {isUniversityLocked(university.id) && (
                <Badge variant="warning" size="sm">
                  🔒
                </Badge>
              )}
            </div>
            <p className="text-xs md:text-sm text-neutral-600 truncate">{university.country}</p>
          </div>
        </div>

        <div className={`grid ${showScoring ? 'grid-cols-2' : 'grid-cols-1'} gap-2 md:gap-3 mb-4`}>
          {showScoring && (
            <div>
              <p className="text-xs text-neutral-600 mb-1">Acceptance Likelihood</p>
              <Badge variant={getChanceBadgeVariant(university.acceptance_likelihood || 'Medium')} size="sm">
                {university.acceptance_likelihood || 'Medium'}
              </Badge>
            </div>
          )}
          <div>
            <p className="text-xs text-neutral-600 mb-1">Average Cost</p>
            <Badge variant={university.avg_cost < 20000 ? 'success' : university.avg_cost < 40000 ? 'warning' : 'danger'} size="sm">
              ${(university.avg_cost / 1000).toFixed(0)}K
            </Badge>
            {university.cost_fit && (
              <p className="text-[9px] md:text-[10px] text-neutral-500 mt-1">Cost fit: {university.cost_fit}</p>
            )}
          </div>
        </div>

        {showScoring && (
          <div className="mb-4">
            <p className="text-xs text-neutral-600 mb-1">Risk Level</p>
            <Badge variant={getRiskBadgeVariant(university.risk_level || 'Medium')} size="sm">
              {getRiskLabel(university.risk_level)}
            </Badge>
          </div>
        )}

        {showScoring && university.why_medium && university.why_medium.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-neutral-600 mb-1">Readiness Notes</p>
            <ul className="list-disc list-inside text-xs text-neutral-700 space-y-1">
              {university.why_medium.map((note, index) => (
                <li key={`${university.id}-why-${index}`}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs text-neutral-600 mb-1">Fields Offered</p>
          <p className="text-xs md:text-sm text-neutral-900 line-clamp-2">
            {university.fields?.join(', ') || 'Not specified'}
          </p>
        </div>

          <div className="flex gap-1 md:gap-2 flex-wrap">
          {(context === 'recommendations' || context === 'all') && (
            <>
              {isUniversityLocked(university.id) ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnlock(university.id)}
                  className="flex-1 min-w-[80px] text-xs md:text-sm"
                >
                  Unlock
                </Button>
              ) : isUniversityShortlisted(university.id) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(university.id)}
                  className="flex-1 min-w-[80px] text-xs md:text-sm"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleShortlist(university.id)}
                  className="flex-1 min-w-[80px] text-xs md:text-sm"
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
                  className="flex-1 min-w-[80px] text-xs md:text-sm"
                >
                  Unlock
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLock(university.id)}
                  className="flex-1 min-w-[80px] text-xs md:text-sm"
                >
                  Lock
                </Button>
              )}
              {!university.locked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(university.id)}
                  className="flex-1 min-w-[80px] text-xs md:text-sm"
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
              className="flex-1 min-w-[80px] text-xs md:text-sm"
            >
              Unlock
            </Button>
          )}
        </div>
        </CardContent>
      </Card>
    );
  };

  const recommendationsCount = recommendations
    ? (recommendations.dream?.length || 0) + (recommendations.target?.length || 0) + (recommendations.safe?.length || 0)
    : 0;

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    allUniversities.forEach((uni) => {
      if (uni.country) set.add(uni.country);
    });
    return Array.from(set).sort();
  }, [allUniversities]);

  const fieldOptions = useMemo(() => {
    const set = new Set<string>();
    allUniversities.forEach((uni) => {
      uni.fields?.forEach((field) => set.add(field));
    });
    return Array.from(set).sort();
  }, [allUniversities]);

  const recommendationSets = useMemo(() => {
    const safe = new Set<number>();
    const target = new Set<number>();
    const dream = new Set<number>();

    recommendations?.safe?.forEach((uni) => safe.add(uni.id));
    recommendations?.target?.forEach((uni) => target.add(uni.id));
    recommendations?.dream?.forEach((uni) => dream.add(uni.id));

    return { safe, target, dream };
  }, [recommendations]);

  const filteredUniversities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allUniversities.filter((uni) => {
      const matchesSearch = term
        ? (
            uni.name?.toLowerCase().includes(term) ||
            uni.country?.toLowerCase().includes(term) ||
            uni.fields?.some((field) => field.toLowerCase().includes(term))
          )
        : true;

      const matchesCountry = countryFilter ? uni.country === countryFilter : true;
      const matchesField = fieldFilter
        ? uni.fields?.some((field) => field === fieldFilter)
        : true;

      return matchesSearch && matchesCountry && matchesField;
    });
  }, [allUniversities, searchTerm, countryFilter, fieldFilter]);

  const filteredRecommendations = useMemo(() => {
    if (!recommendations) {
      return { dream: [], target: [], safe: [] };
    }

    if (acceptanceLikelihoodFilter === 'dream') {
      return { dream: recommendations.dream || [], target: [], safe: [] };
    }

    if (acceptanceLikelihoodFilter === 'target') {
      return { dream: [], target: recommendations.target || [], safe: [] };
    }

    if (acceptanceLikelihoodFilter === 'safe') {
      return { dream: [], target: [], safe: recommendations.safe || [] };
    }

    return recommendations;
  }, [recommendations, acceptanceLikelihoodFilter]);

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
        <div className="flex gap-1 md:gap-2 border-b border-neutral-200 overflow-x-auto -mx-4 px-4">
          {[
            { key: 'all', label: 'Discover', labelFull: 'Discover', count: filteredUniversities.length },
            { key: 'recommendations', label: 'Rec.', labelFull: 'Recommendations', count: recommendationsCount },
            { key: 'shortlisted', label: 'Short.', labelFull: 'Shortlisted', count: shortlisted.length },
            { key: 'locked', label: 'Locked', labelFull: 'Locked', count: locked.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 md:px-6 py-2 md:py-3 font-medium transition-colors border-b-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
              title={tab.labelFull}
            >
              <span className="hidden md:inline">{tab.labelFull}</span>
              <span className="md:hidden">{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-6 shadow-md">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <div className="flex-1">
                  <label className="text-xs text-neutral-600">Search</label>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, country, or field"
                    className="mt-1 w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="w-full md:w-52">
                  <label className="text-xs text-neutral-600">Country</label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All countries</option>
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-52">
                  <label className="text-xs text-neutral-600">Field</label>
                  <select
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All fields</option>
                    {fieldOptions.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setCountryFilter('');
                      setFieldFilter('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-3">Showing {filteredUniversities.length} universities</p>
            </div>

            {filteredUniversities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-neutral-600 mb-4">No universities match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredUniversities.map((uni) => renderUniversityCard(uni, 'all'))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && recommendations && (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAcceptanceLikelihoodFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  acceptanceLikelihoodFilter === 'all'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAcceptanceLikelihoodFilter('safe')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  acceptanceLikelihoodFilter === 'safe'
                    ? 'bg-accent-600 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                🛟 Safe
              </button>
              <button
                onClick={() => setAcceptanceLikelihoodFilter('target')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  acceptanceLikelihoodFilter === 'target'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                🎯 Target
              </button>
              <button
                onClick={() => setAcceptanceLikelihoodFilter('dream')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  acceptanceLikelihoodFilter === 'dream'
                    ? 'bg-primary-700 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                🌟 Dream
              </button>
            </div>

            {/* Safe Universities */}
            {filteredRecommendations.safe && filteredRecommendations.safe.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-accent-600 mb-1">🛟 Safe Universities</h2>
                  <p className="text-sm text-neutral-600">Strong match - your profile aligns well, high acceptance likelihood.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredRecommendations.safe.map((uni) => renderUniversityCard(uni, 'recommendations'))}
                </div>
              </div>
            )}

            {/* Target Universities */}
            {filteredRecommendations.target && filteredRecommendations.target.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-primary-600 mb-1">🎯 Target Universities</h2>
                  <p className="text-sm text-neutral-600">Well-matched options - balanced opportunity with reasonable effort.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredRecommendations.target.map((uni) => renderUniversityCard(uni, 'recommendations'))}
                </div>
              </div>
            )}

            {/* Dream Universities */}
            {filteredRecommendations.dream && filteredRecommendations.dream.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-primary-700 mb-1">🌟 Dream Universities</h2>
                  <p className="text-sm text-neutral-600">Reach goals - higher competition or cost. Requires strong preparation.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredRecommendations.dream.map((uni) => renderUniversityCard(uni, 'recommendations'))}
                </div>
              </div>
            )}

            {/* No recommendations */}
            {(!filteredRecommendations.dream || filteredRecommendations.dream.length === 0) &&
             (!filteredRecommendations.target || filteredRecommendations.target.length === 0) &&
             (!filteredRecommendations.safe || filteredRecommendations.safe.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-neutral-600 mb-4">No universities match your criteria. Try adjusting your preferences.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shortlisted' && (
          <div>
            {shortlisted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-neutral-600 mb-4">No universities shortlisted yet</p>
                <Button variant="primary" onClick={() => setActiveTab('recommendations')}>
                  View Recommendations
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {shortlisted.map((uni) => renderUniversityCard(uni, 'shortlisted'))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'locked' && (
          <div className="min-h-[400px] flex items-center justify-center">
            {locked.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 w-full">
                <div className="max-w-md w-full text-center">
                  <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full">
                    <span className="text-4xl">🔒</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-neutral-900 mb-3">
                    No Locked Universities
                  </h3>
                  <p className="text-sm md:text-base text-neutral-600 mb-6 leading-relaxed">
                    You have no locked universities. Please lock at least one to proceed with applications.
                  </p>
                  <div className="flex justify-center">
                    <Button variant="primary" onClick={() => setActiveTab('shortlisted')} className="w-full sm:w-auto">
                      View Shortlisted Universities
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
                {locked.map((uni) => renderUniversityCard(uni, 'locked'))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unlock Confirmation Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelUnlock}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full">
              <span className="text-3xl">🔓</span>
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-bold text-neutral-900 text-center mb-3">
              Unlock University?
            </h3>
            
            {/* Message */}
            <p className="text-neutral-700 text-center mb-6 leading-relaxed">
              Unlocking a university signals a change in commitment. You can unlock later if needed, but do it intentionally to stay focused.
            </p>
            
            {/* Actions */}
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
                className="flex-1 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700"
              >
                Yes, Unlock
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
