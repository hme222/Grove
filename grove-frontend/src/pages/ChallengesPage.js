import React, { useState, useEffect } from 'react';
import { challengeAPI, goalAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Target, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ChallengesPage() {
  const [templates, setTemplates] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  const fetchData = async () => {
    try {
      const [templatesRes, goalsRes] = await Promise.all([
        challengeAPI.getTemplates(),
        goalAPI.getAll('active'),
      ]);
      setTemplates(templatesRes.data);
      setGoals(goalsRes.data);
    } catch (e) {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStart = async (slug) => {
    // Check if user already has this challenge active
    const existingGoal = goals.find(g => g.title === templates.find(t => t.slug === slug)?.title);
    if (existingGoal) {
      toast.error('You already have this challenge active');
      return;
    }

    setStarting(slug);
    try {
      await challengeAPI.start(slug);
      toast.success('Challenge started! Check your Goals.');
      fetchData();
    } catch (e) {
      toast.error('Failed to start challenge');
    } finally {
      setStarting(null);
    }
  };

  const getChallengeIcon = (goalType) => {
    switch (goalType) {
      case 'streak_days': return Trophy;
      case 'plant_count': return TrendingUp;
      case 'care_logs_count': return Target;
      default: return Calendar;
    }
  };

  const activeChallenges = goals.filter(g => 
    templates.some(t => t.title === g.title)
  );

  return (
    <div>
      <PageHeader
        title="Challenges"
        count={activeChallenges.length}
      />

      <div className="max-w-[1100px] mx-auto px-4 py-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Active Challenges */}
            {activeChallenges.length > 0 && (
              <div>
                <h2 className="font-plant text-grove-cream text-sm mb-3">Your Active Challenges</h2>
                <div className="space-y-2">
                  {activeChallenges.map((goal) => {
                    const Icon = getChallengeIcon(goal.goal_type);
                    return (
                      <div
                        key={goal.id}
                        className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-4"
                        data-testid="active-challenge"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-grove-lime flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-grove-cream" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-plant text-grove-cream text-base">{goal.title}</h3>
                            {goal.description && (
                              <p className="text-sm text-grove-cream mt-1">{goal.description}</p>
                            )}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs font-mono mb-1">
                                <span className="text-grove-cream">Progress</span>
                                <span className="text-grove-sprout">
                                  {goal.current_value} / {goal.target_value}
                                </span>
                              </div>
                              <div className="w-full bg-grove-moss rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-grove-lime h-full transition-all duration-300"
                                  style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Challenges */}
            <div>
              <h2 className="font-plant text-grove-cream text-sm mb-3">
                {activeChallenges.length > 0 ? 'More Challenges' : 'Available Challenges'}
              </h2>
              {templates.length === 0 && (
                <p className="font-ui text-sm text-grove-sage" data-testid="challenges-empty">No challenges right now. Check back soon.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((template) => {
                  const Icon = getChallengeIcon(template.goal_type);
                  const isActive = activeChallenges.some(g => g.title === template.title);
                  return (
                    <div
                      key={template.slug}
                      className={`rounded-[14px] border-[0.5px] border-grove-moss p-4 ${
                        isActive ? 'bg-grove-moss opacity-60' : 'bg-grove-moss'
                      }`}
                      data-testid="challenge-template"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-grove-moss' : 'bg-grove-lime'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            isActive ? 'text-grove-cream' : 'text-grove-cream'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-plant text-grove-cream text-base">{template.title}</h3>
                          <p className="text-sm text-grove-cream mt-1">{template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono text-grove-cream">
                          Target: {template.target_value}
                          {template.duration_days && ` • ${template.duration_days} days`}
                        </div>
                        {!isActive && (
                          <button
                            onClick={() => handleStart(template.slug)}
                            disabled={starting === template.slug}
                            className="rounded-[12px] font-[Georgia] text-xs px-4 py-2 bg-grove-lime text-grove-root border-[0.5px] border-grove-fernLine hover:bg-grove-sprout disabled:opacity-50 transition-colors duration-150"
                            data-testid="challenge-start-button"
                          >
                            {starting === template.slug ? 'Starting...' : 'Start'}
                          </button>
                        )}
                        {isActive && (
                          <span className="text-xs text-grove-sprout font-sans">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
