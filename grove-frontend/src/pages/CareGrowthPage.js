import React, { useState, useEffect } from 'react';
import { statsAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'sonner';
import { Leaf, Flame, Droplets, Clock, Sprout, TrendingUp } from 'lucide-react';

export default function CareGrowthPage() {
  const [stats, setStats] = useState(null);
  const [careHours, setCareHours] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, h] = await Promise.all([statsAPI.getStats(), statsAPI.getCareHours()]);
        setStats(s.data);
        setCareHours(h.data);
      } catch (e) {
        toast.error('Failed to load growth stats');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Growth" />
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const showAdvanced = !!stats?.show_advanced_analytics;

  const basicTiles = [
    { label: 'Plants', value: stats?.total_plants || 0, icon: Leaf },
    { label: 'Streak', value: `${stats?.current_streak || 0}d`, icon: Flame },
    { label: 'Care logs', value: stats?.total_care_logs || 0, icon: Droplets },
    { label: 'Hours', value: `${stats?.estimated_care_hours || 0}h`, icon: Clock },
  ];

  return (
    <div>
      <PageHeader title="Growth" />

      <div className="max-w-[900px] mx-auto px-4 py-4 space-y-4">
        {/* Basic tiles */}
        <div className="grid grid-cols-4 gap-2" data-testid="growth-basic-tiles">
          {basicTiles.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-3 text-center">
              <Icon className="h-4 w-4 mx-auto text-[#3B6D11] mb-1" />
              <p className="font-plant text-[#1C2E10] text-lg">{value}</p>
              <p className="font-ui text-[9px] text-[#2B2B26] uppercase tracking-[0.12em]">{label}</p>
            </div>
          ))}
        </div>

        {/* Thriving rate (positive phrasing) */}
        {stats?.thriving_rate != null && (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="growth-thriving-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-plant text-[#1C2E10] text-sm">Collection Vitality</h3>
              <Sprout className="h-4 w-4 text-[#3B6D11]" />
            </div>
            <p className="font-plant text-[#1C2E10] text-3xl mb-1">
              {stats.thriving_rate}<span className="text-lg text-[#2B2B26]">%</span>
            </p>
            <p className="font-ui text-xs text-[#2B2B26]">
              Plants currently thriving in your collection.
            </p>
            {stats.past_plants_count > 0 && (
              <p className="font-latin text-[10px] text-[#D3C9B8] mt-1.5">
                {stats.past_plants_count} past plant{stats.past_plants_count === 1 ? '' : 's'} honored in your history.
              </p>
            )}
          </div>
        )}

        {/* Care hours breakdown */}
        {careHours && Object.keys(careHours).length > 1 && (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="growth-hours-breakdown">
            <h3 className="font-plant text-[#1C2E10] text-sm mb-3">
              Estimated Care Time
              <span className="font-latin text-[10px] text-[#2B2B26] ml-2">{careHours.total_hours}h total</span>
            </h3>
            <div className="space-y-2">
              {Object.entries(careHours)
                .filter(([key]) => key !== 'total_hours')
                .sort((a, b) => b[1].count - a[1].count)
                .map(([action, data]) => (
                  <div key={action} className="flex items-center justify-between">
                    <span className="font-ui text-xs text-[#1A1A17] capitalize">{action.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-latin text-[10px] text-[#2B2B26]">{data.count}x</span>
                      <span className="font-latin text-[10px] text-[#D3C9B8]">·</span>
                      <span className="font-latin text-[10px] text-[#2B2B26]">{data.estimated_minutes}min</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Advanced analytics (gated) */}
        {showAdvanced ? (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="growth-advanced-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-plant text-[#1C2E10] text-sm">Advanced Analytics</h3>
              <TrendingUp className="h-4 w-4 text-[#3B6D11]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] p-3">
                <p className="font-latin text-[9px] text-[#2B2B26] uppercase tracking-[0.12em]">Propagations</p>
                <p className="font-plant text-[#1C2E10] text-xl">{stats?.propagation_count || 0}</p>
              </div>
              <div className="rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] p-3">
                <p className="font-latin text-[9px] text-[#2B2B26] uppercase tracking-[0.12em]">Longest Streak</p>
                <p className="font-plant text-[#1C2E10] text-xl">{stats?.longest_streak || 0}d</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="growth-advanced-locked">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="h-4 w-4 text-[#3B6D11]" />
              <h3 className="font-plant text-[#1C2E10] text-sm">Advanced Analytics</h3>
            </div>
            <p className="font-ui text-xs text-[#2B2B26] leading-relaxed">
              Unlock propagation trends, streak analysis, and more when you reach 10+ plants on a Pro plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
