import React, { useState, useEffect } from 'react';
import useDialogA11y from '../lib/useDialogA11y';
import { useNavigate, Navigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { getFileUrl, swapsAPI } from '../lib/api';
import axios from 'axios';
import { Leaf, Heart, X, Sparkles, ChevronLeft, MessageCircle, Users } from 'lucide-react';
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

  const dialogRef = React.useRef(null);
  useDialogA11y(dialogRef, onDone);
  return (
    <div
      data-testid="swap-celebration"
      role="dialog"
      aria-modal="true"
      aria-label="Swap unlocked"
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[240] bg-grove-night/85 flex items-center justify-center p-6 focus:outline-none"
      onClick={onDone}
    >
      <div className="relative text-center">
        {/* Floating petals */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <span
              key={i}
              className="absolute block w-2 h-2 rounded-full bg-grove-moss opacity-0 animate-[petal_1.8s_ease-out_forwards]"
              style={{
                left: `${(i * 13) % 100}%`,
                top: `${(i * 17) % 100}%`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
        <div className="w-20 h-20 mx-auto rounded-full bg-grove-lime border-[0.5px] border-grove-lime flex items-center justify-center mb-4 animate-[popin_350ms_ease-out]">
          <Sparkles className="h-9 w-9 text-grove-sprout" />
        </div>
        <h2 className="font-plant text-grove-cream text-3xl mb-2">Swap unlocked</h2>
        <p className="font-ui text-sm text-grove-sprout max-w-sm">
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

  const handleChoice = async (direction) => {
    const card = cards[index];
    if (!card) return;
    setLeaving(direction);
    setTimeout(() => {
      setLeaving(null);
      setIndex((i) => i + 1);
    }, 260);
    try {
      if (direction === 'right') {
        const res = await swapsAPI.interest(card.plant_id);
        if (res.data.matched) {
          toast.success("It's a match! You can now message each other.", { duration: 4000 });
        } else {
          toast.success('Interest saved');
        }
      } else {
        await swapsAPI.pass(card.plant_id);
      }
    } catch (e) {
      // Don't block the UI on swipe failures
      console.error('Swap action failed', e);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Swap" />
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const unlocked = deck?.unlocked;
  const currentStreak = deck?.current_streak || 0;

  if (!unlocked) {
    // Swaps follow the eligibility rules on the Swaps page, so explain them there.
    return <Navigate to="/swaps" replace />;
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
        rightContent={
          <button
            onClick={() => navigate('/swaps/matches')}
            className="rounded-[12px] font-ui text-xs px-3 py-2 border-[0.5px] border-grove-moss text-grove-cream hover:border-grove-fernLine flex items-center gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            Matches
          </button>
        }
      />

      <div className="max-w-[500px] mx-auto px-4 py-4">
        {current ? (
          <div
            key={current.plant_id + '-' + index}
            data-testid="swap-card"
            className={`rounded-[16px] border-[0.5px] border-grove-moss bg-grove-moss overflow-hidden transform transition-all duration-[260ms] ease-out ${
              leaving === 'right' ? 'translate-x-[120%] rotate-6 opacity-0'
              : leaving === 'left' ? '-translate-x-[120%] -rotate-6 opacity-0'
              : 'translate-x-0 opacity-100'
            }`}
          >
            <div className="aspect-[4/5] bg-grove-moss flex items-center justify-center">
              {current.photo_url ? (
                <div className="w-full h-full bg-grove-moss flex items-center justify-center"><img src={getFileUrl(current.photo_url)} alt={current.common_name} className="w-full h-full object-cover" /></div>
              ) : (
                <Leaf className="h-16 w-16 text-grove-sprout opacity-30" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-plant text-grove-cream text-xl">
                {current.nickname || current.common_name}
              </h3>
              {current.latin_name && (
                <p className="font-latin text-[12px] text-grove-cream italic">{current.latin_name}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 rounded-[20px] border-[0.5px] border-grove-moss bg-grove-forest px-2 py-0.5 font-latin text-xs text-grove-cream">
                  <span>from @{current.owner_username}</span>
                  <VerifiedProBadge
                    verified_user={current.owner_verified_user}
                    verified_by_admin={current.owner_verified_by_admin}
                    size={12}
                  />
                </span>
                {current.owner_location && (
                  <span className="font-latin text-xs text-grove-sage">· {current.owner_location}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16" data-testid="swap-empty">
            <div className="w-16 h-16 mx-auto rounded-full bg-grove-moss border-[0.5px] border-grove-moss flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-grove-sprout" />
            </div>
            <p className="font-plant text-grove-cream text-lg mb-1">You've seen the current deck</p>
            <p className="font-ui text-sm text-grove-cream mb-4">Check back soon — new cuttings are always being added.</p>
            <button
              onClick={() => navigate('/swaps/matches')}
              className="rounded-[12px] font-ui text-xs px-4 py-2.5 bg-grove-lime text-grove-root hover:bg-grove-sprout inline-flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              View matches
            </button>
          </div>
        )}

        {/* Swipe controls */}
        {current && (
          <div className="flex items-center justify-center gap-6 mt-4" data-testid="swap-controls">
            <button
              onClick={() => handleChoice('left')}
              aria-label="Pass"
              data-testid="swap-pass"
              className="w-14 h-14 rounded-full border-[0.5px] border-grove-moss bg-grove-forest text-grove-cream hover:border-grove-bloom hover:text-grove-blush flex items-center justify-center transition-colors duration-150"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleChoice('right')}
              aria-label="Interested"
              data-testid="swap-like"
              className="w-14 h-14 rounded-full border-[0.5px] border-grove-fernLine bg-grove-lime text-grove-root hover:bg-grove-sprout flex items-center justify-center transition-colors duration-150"
            >
              <Heart className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
