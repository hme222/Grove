import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { getFileUrl } from '../lib/api';
import axios from 'axios';
import { Leaf, Heart, X, Sparkles, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import VerifiedProBadge from '../components/VerifiedProBadge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function authedGet(path) {
  const token = localStorage.getItem('grove_access_token');
  return axios.get(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

function CelebrationOverlay({ onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div
      data-testid="swap-celebration"
      className="fixed inset-0 z-[240] bg-[#1C2E10]/85 flex items-center justify-center p-6"
      onClick={onDone}
    >
      <div className="relative text-center">
        {/* Floating petals */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <span
              key={i}
              className="absolute block w-2 h-2 rounded-full bg-[#9FE1CB] opacity-0 animate-[petal_1.8s_ease-out_forwards]"
              style={{
                left: `${(i * 13) % 100}%`,
                top: `${(i * 17) % 100}%`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
        <div className="w-20 h-20 mx-auto rounded-full bg-[#2D5016] border-[0.5px] border-[#5DCAA5] flex items-center justify-center mb-4 animate-[popin_350ms_ease-out]">
          <Sparkles className="h-9 w-9 text-[#9FE1CB]" />
        </div>
        <h2 className="font-plant text-[#F5F0E8] text-3xl mb-2">Swap unlocked</h2>
        <p className="font-ui text-sm text-[#9FE1CB] max-w-sm">
          Thirty days of care earned you a pass to the community swap deck. Your first matches are ready.
        </p>
      </div>
      <style>{`
        @keyframes popin { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes petal {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.9; }
          100% { transform: translateY(120px) rotate(220deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function SwapPage() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [leaving, setLeaving] = useState(null); // 'left' | 'right' | null

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const res = await authedGet('/swap/deck?limit=20');
        setDeck(res.data);
        // Show celebration once per session if user just unlocked
        const seen = sessionStorage.getItem('grove_swap_celebrated');
        if (res.data.unlocked && !seen) {
          setShowCelebrate(true);
          sessionStorage.setItem('grove_swap_celebrated', '1');
        }
      } catch (e) {
        toast.error('Failed to load swap deck');
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, []);

  const handleChoice = (direction) => {
    setLeaving(direction);
    setTimeout(() => {
      setLeaving(null);
      setIndex((i) => i + 1);
      if (direction === 'right') toast.success('Interest saved');
    }, 260);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Swap" />
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const unlocked = deck?.unlocked;
  const currentStreak = deck?.current_streak || 0;

  if (!unlocked) {
    return (
      <div>
        <PageHeader
          title="Swap"
          rightContent={
            <button
              onClick={() => navigate('/profile')}
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] hover:border-[#3B6D11] flex items-center gap-1.5"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
          }
        />
        <div className="max-w-[500px] mx-auto px-4 py-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EAF3DE] border-[0.5px] border-[#D3C9B8] flex items-center justify-center mb-4">
            <Leaf className="h-7 w-7 text-[#3B6D11]" />
          </div>
          <h2 className="font-plant text-[#1C2E10] text-2xl mb-2">Swap opens at a 30-day streak</h2>
          <p className="font-ui text-sm text-[#2B2B26] leading-relaxed">
            You’re on day {currentStreak}. Keep tending daily and swapping opens up with {30 - currentStreak} more days of care.
          </p>
        </div>
      </div>
    );
  }

  const cards = deck.cards || [];
  const current = cards[index];
  const remaining = cards.length - index;

  return (
    <div>
      {showCelebrate && <CelebrationOverlay onDone={() => setShowCelebrate(false)} />}

      <PageHeader
        title="Swap"
        count={Math.max(0, remaining)}
      />

      <div className="max-w-[500px] mx-auto px-4 py-4">
        {current ? (
          <div
            key={current.plant_id + '-' + index}
            data-testid="swap-card"
            className={`rounded-[16px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] overflow-hidden transform transition-all duration-[260ms] ease-out ${
              leaving === 'right' ? 'translate-x-[120%] rotate-6 opacity-0'
              : leaving === 'left' ? '-translate-x-[120%] -rotate-6 opacity-0'
              : 'translate-x-0 opacity-100'
            }`}
          >
            <div className="aspect-[4/5] bg-[#EAF3DE] flex items-center justify-center">
              {current.photo_url ? (
                <div className="w-full h-full bg-[#EAF3DE] flex items-center justify-center"><img src={getFileUrl(current.photo_url)} alt={current.common_name} className="max-w-full max-h-full w-auto h-auto object-contain" /></div>
              ) : (
                <Leaf className="h-16 w-16 text-[#3B6D11] opacity-30" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-plant text-[#1C2E10] text-xl">
                {current.nickname || current.common_name}
              </h3>
              {current.latin_name && (
                <p className="font-latin text-[11px] text-[#2B2B26] italic">{current.latin_name}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 rounded-[20px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] px-2 py-0.5 font-latin text-[10px] text-[#2B2B26]">
                  <span>from @{current.owner_username}</span>
                  <VerifiedProBadge
                    verified_user={current.owner_verified_user}
                    verified_by_admin={current.owner_verified_by_admin}
                    size={12}
                  />
                </span>
                {current.owner_location && (
                  <span className="font-latin text-[10px] text-[#D3C9B8]">· {current.owner_location}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16" data-testid="swap-empty">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#EAF3DE] border-[0.5px] border-[#D3C9B8] flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-[#3B6D11]" />
            </div>
            <p className="font-plant text-[#1C2E10] text-lg mb-1">You’ve seen the current deck</p>
            <p className="font-ui text-sm text-[#2B2B26]">Check back soon — new cuttings are always being added.</p>
          </div>
        )}

        {/* Swipe controls */}
        {current && (
          <div className="flex items-center justify-center gap-6 mt-4" data-testid="swap-controls">
            <button
              onClick={() => handleChoice('left')}
              aria-label="Pass"
              data-testid="swap-pass"
              className="w-14 h-14 rounded-full border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] text-[#2B2B26] hover:border-[#D4537E] hover:text-[#D4537E] flex items-center justify-center transition-colors duration-150"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleChoice('right')}
              aria-label="Interested"
              data-testid="swap-like"
              className="w-14 h-14 rounded-full border-[0.5px] border-[#3B6D11] bg-[#3B6D11] text-[#F5F0E8] hover:bg-[#2D5016] flex items-center justify-center transition-colors duration-150"
            >
              <Heart className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
