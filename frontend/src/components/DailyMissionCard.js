import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, Camera, Leaf, Sparkles, Check, ArrowRight } from 'lucide-react';
import { missionAPI } from '../lib/api';
import { impactLight, success, spawnRipple } from '../lib/haptics';

const ICON_MAP = {
  droplet: Droplet,
  camera: Camera,
  leaf: Leaf,
  sparkles: Sparkles,
};

export default function DailyMissionCard({ onCompleted }) {
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const fetchMission = async () => {
    try {
      const res = await missionAPI.getDaily();
      setMission(res.data);
    } catch (e) {
      // Silent failure — mission card is enhancement only
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMission(); }, []);

  // Allow parent to nudge a refresh after care actions / engagement actions.
  useEffect(() => {
    const handler = () => fetchMission();
    window.addEventListener('grove:mission-refresh', handler);
    return () => window.removeEventListener('grove:mission-refresh', handler);
  }, []);

  if (loading || !mission) return null;

  const Icon = ICON_MAP[mission.icon] || Leaf;
  const completed = mission.completed || justCompleted;

  const handleCta = (e) => {
    impactLight(e.currentTarget);
    if (mission.cta_path) navigate(mission.cta_path);
  };

  const handleManualComplete = async (e) => {
    if (completing || completed) return;
    setCompleting(true);
    try {
      const res = await missionAPI.completeDaily();
      setMission(res.data);
      setJustCompleted(true);
      success(e.currentTarget);
      if (onCompleted) onCompleted(res.data);
    } catch (err) {
      spawnRipple(e.currentTarget, { tone: 'warm' });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <section
      data-testid="daily-mission-card"
      data-mission-type={mission.mission_type}
      data-mission-completed={completed ? 'true' : 'false'}
      className={`relative overflow-hidden rounded-[16px] border-[0.5px] px-4 py-3 mb-3 ${
        completed
          ? 'border-[#3B6D11]/40 bg-[#EAF3DE]'
          : 'border-[#D3C9B8] bg-[#FDFAF6]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
            completed ? 'bg-[#3B6D11] text-[#EAF3DE]' : 'bg-[#1C2E10] text-[#9FE1CB]'
          }`}
          aria-hidden="true"
        >
          {completed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-plant uppercase tracking-[0.1em] text-[10px] text-[#5F5E5A]">
            Today's mission
          </p>
          <h3
            data-testid="daily-mission-title"
            className="font-plant text-[#1C2E10] text-base leading-snug truncate"
          >
            {completed ? 'Mission complete' : mission.title}
          </h3>
          <p className="font-ui text-xs text-[#5F5E5A] mt-0.5 line-clamp-2">
            {completed
              ? 'Nice work — see you tomorrow.'
              : mission.subtitle}
          </p>
        </div>
        {!completed && (
          <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
            <button
              type="button"
              onClick={handleCta}
              data-testid="daily-mission-cta"
              className="relative overflow-hidden rounded-[8px] bg-[#1C2E10] text-[#F5F0E8] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 hover:bg-[#2D5016] transition-colors duration-150 flex items-center gap-1"
            >
              {mission.cta || 'Begin'}
              <ArrowRight className="h-3 w-3" />
            </button>
            {mission.mission_type === 'health_check' && (
              <button
                type="button"
                onClick={handleManualComplete}
                data-testid="daily-mission-manual-complete"
                className="text-[10px] font-ui text-[#5F5E5A] underline-offset-2 hover:underline"
              >
                {completing ? 'Logging...' : 'Mark as done'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
