import { LoadErrorPage } from '../components/LoadError';
import Loading from '../components/Loading';
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { PageHeader, HeaderAction } from '../components/PageHeader';
import { getFileUrl, swapsAPI } from '../lib/api';
import axios from 'axios';
import { Leaf, Heart, X, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import VerifiedProBadge from '../components/VerifiedProBadge';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import PhotoBand from '../components/PhotoBand';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function authedGet(path) {
  const token = localStorage.getItem('grove_access_token');
  return axios.get(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

export default function SwapPage() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [ineligible, setIneligible] = useState(false);
  const [leaving, setLeaving] = useState(null); // 'left' | 'right' | null

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setLoadError(false);
        // The Swaps page owns the eligibility rules (account age, Pro, verification). Someone who does not meet
        // them is sent there; if the check itself fails, the deck's own unlock flag decides.
        const elig = await swapsAPI.eligibility().then((r) => r.data).catch(() => null);
        if (elig && elig.eligible === false) { setIneligible(true); setLoading(false); return; }
        const res = await authedGet('/swap/deck?limit=20');
        setDeck(res.data);
      } catch (e) {
        setLoadError(true);
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
          toast.success("It’s a match! You can now message each other.", { duration: 4000 });
        } else {
          toast.success('Interest saved');
        }
      } else {
        await swapsAPI.pass(card.plant_id);
      }
    } catch (e) {
      // Don't block the card on a failure, but say why when the server explains it (for example: add a plant first).
      const detail = e?.response?.data?.detail;
      if (e?.response?.status === 403 && typeof detail === 'string') toast.error(detail);
      console.error('Swap action failed', e);
    }
  };

  if (ineligible) return <Navigate to="/swaps" replace />;
  if (loadError) {
    return <LoadErrorPage back title="Browse swaps" what="swaps" onRetry={() => window.location.reload()} />;
  }
  if (loading) {
    return (
      <div>
        <PageHeader back title="Browse swaps" />
        <Loading label="Loading swaps" />
      </div>
    );
  }

  const unlocked = deck?.unlocked;

  if (!unlocked) {
    // Swaps follow the eligibility rules on the Swaps page, so explain them there.
    return <Navigate to="/swaps" replace />;
  }

  const cards = deck.cards || [];
  const current = cards[index];

  return (
    <div>

      <PageHeader back
        title="Browse swaps"
      />

      <div className="max-w-form mx-auto px-4 py-4">
        <div className="mb-3 flex items-center justify-end">
          <HeaderAction icon={Users} onClick={() => navigate('/swaps/matches')} data-testid="swap-matches-button">
            Matches
          </HeaderAction>
        </div>
        {current ? (
          <div
            key={current.plant_id + '-' + index}
            data-testid="swap-card"
            className={`rounded-card border-hairline border-grove-moss bg-grove-moss overflow-hidden transform transition-all duration-settle ease-out ${
              leaving === 'right' ? 'translate-x-full rotate-6 opacity-0'
              : leaving === 'left' ? '-translate-x-full -rotate-6 opacity-0'
              : 'translate-x-0 opacity-100'
            }`}
          >
            <div className="aspect-portrait bg-grove-moss flex items-center justify-center">
              {current.photo_url ? (
                <PhotoBand src={getFileUrl(current.photo_url)} alt={current.common_name} ratio="portrait" className="rounded-none" />
              ) : (
                <Leaf className="h-16 w-16 text-grove-sprout opacity-30" />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-plant text-grove-cream text-xl">
                {current.nickname || current.common_name}
              </h3>
              {current.latin_name && (
                <p className="font-latin text-xs text-grove-cream italic">{current.latin_name}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 rounded-pill border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1 font-latin text-xs text-grove-cream min-h-6">
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
            <div className="w-16 h-16 mx-auto rounded-pill bg-grove-moss border-hairline border-grove-moss flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-grove-sprout" />
            </div>
            <p className="font-plant text-grove-cream text-lg mb-1">You’ve seen the current deck</p>
            <p className="font-ui text-sm text-grove-cream mb-4">Check back soon. New cuttings are always being added.</p>
            <button
              onClick={() => navigate('/swaps/matches')}
              className={cn(buttonVariants(), "gap-1.5")}
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
              className="w-14 h-14 rounded-pill border-hairline border-grove-moss bg-grove-forest text-grove-cream hover:border-grove-bloom hover:text-grove-blush flex items-center justify-center transition-colors duration-150"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleChoice('right')}
              aria-label="Interested"
              data-testid="swap-like"
              className={cn(buttonVariants(), "h-14 w-14 rounded-pill px-0")}
            >
              <Heart className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
