import { LoadErrorPage } from '../components/LoadError';
import Loading from '../components/Loading';
import React, { useState, useEffect } from 'react';
import { statsAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { CareTabs } from '../components/CareTabs';
import { Leaf, Droplets, Clock, Sprout, TrendingUp } from 'lucide-react';

export default function CareGrowthPage() {
  const [stats, setStats] = useState(null);
  const [careHours, setCareHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(false);
        const [s, h] = await Promise.all([statsAPI.getStats(), statsAPI.getCareHours()]);
        setStats(s.data);
        setCareHours(h.data);
      } catch (e) {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loadError) {
    return <LoadErrorPage title="Progress" headerExtra={<CareTabs />} onRetry={() => window.location.reload()} />;
  }
  if (loading) {
    return (
      <div>
        <PageHeader title="Progress"><CareTabs /></PageHeader>
        <Loading label="Loading your progress" />
      </div>
    );
  }

  const showAdvanced = !!stats?.show_advanced_analytics;

  const basicTiles = [
    { label: 'Plants', value: stats?.total_plants || 0, icon: Leaf },
    { label: 'Care logs', value: stats?.total_care_logs || 0, icon: Droplets },
    { label: 'Hours', value: `${stats?.estimated_care_hours || 0}h`, icon: Clock },
  ];

  return (
    <div>
      <PageHeader title="Progress"><CareTabs /></PageHeader>

      <div className="max-w-content mx-auto px-4 py-4 space-y-4">
        {/* Basic tiles */}
        <div className="grid grid-cols-3 gap-2" data-testid="growth-basic-tiles">
          {basicTiles.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-center">
              <Icon className="h-4 w-4 mx-auto text-grove-sprout mb-1" />
              <p className="font-plant text-grove-cream text-lg">{value}</p>
              <p className="font-ui text-xs text-grove-cream">{label}</p>
            </div>
          ))}
        </div>

        {/* On schedule: the same overdue rule the Today list uses */}
        {stats?.plants_on_schedule != null && (stats.total_plants || 0) > 0 && (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="growth-thriving-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-plant text-grove-cream text-base font-semibold ">Watering</h3>
              <Sprout className="h-4 w-4 text-grove-sprout" aria-hidden="true" />
            </div>
            {stats.plants_needing_water === 0 ? (
              <>
                <p className="font-plant text-grove-cream text-3xl mb-1">All on schedule</p>
                <p className="font-ui text-sm text-grove-cream">Every one of your {stats.total_plants} {stats.total_plants === 1 ? 'plant is' : 'plants are'} on its watering schedule.</p>
              </>
            ) : (
              <>
                <p className="font-plant text-grove-cream text-3xl mb-1">
                  {stats.plants_needing_water}<span className="text-lg text-grove-cream"> due for water</span>
                </p>
                <p className="font-ui text-sm text-grove-cream">
                  {stats.plants_on_schedule} of {stats.total_plants} {stats.plants_on_schedule === 1 ? 'is' : 'are'} on schedule. The To do tab lists the rest.
                </p>
              </>
            )}
            {stats.past_plants_count > 0 && (
              <p className="font-latin text-xs text-grove-sage mt-1.5">
                {stats.past_plants_count} past plant{stats.past_plants_count === 1 ? '' : 's'} kept in your history.
              </p>
            )}
          </div>
        )}

        {/* Care hours breakdown */}
        {careHours && Object.keys(careHours).length > 1 && (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="growth-hours-breakdown">
            <h3 className="font-plant text-grove-cream text-base font-semibold  mb-3">
              Estimated care time
              <span className="ml-2 font-ui text-xs text-grove-cream">{careHours.total_hours}h total</span>
            </h3>
            <div className="space-y-2">
              {Object.entries(careHours)
                .filter(([key]) => key !== 'total_hours')
                .sort((a, b) => b[1].count - a[1].count)
                .map(([action, data]) => (
                  <div key={action} className="flex items-center justify-between">
                    <span className="font-ui text-sm text-grove-cream first-letter:uppercase">{action.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-ui text-sm tabular-nums text-grove-cream">{data.count === 1 ? '1 time' : `${data.count} times`}</span>
                      <span aria-hidden="true" className="font-ui text-xs text-grove-sage">·</span>
                      <span className="font-ui text-sm tabular-nums text-grove-cream">{data.estimated_minutes} min</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Advanced analytics (gated) */}
        {showAdvanced ? (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="growth-advanced-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-plant text-grove-cream text-base font-semibold ">Advanced analytics</h3>
              <TrendingUp className="h-4 w-4 text-grove-sprout" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="rounded-inset border-hairline border-grove-moss bg-grove-forest p-3">
                <p className="font-latin text-xs text-grove-cream">Propagations</p>
                <p className="font-plant text-grove-cream text-xl">{stats?.propagation_count || 0}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
