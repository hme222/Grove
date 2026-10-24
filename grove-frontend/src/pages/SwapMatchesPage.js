import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { swapsAPI, getFileUrl } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Repeat, MessageCircle, Leaf, ChevronRight, Sparkles } from 'lucide-react';
import VerifiedProBadge from '../components/VerifiedProBadge';

export default function SwapMatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await swapsAPI.getMatches();
        setMatches(res.data.matches || []);
      } catch (e) {
        console.error('Failed to load matches', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Swap Matches" />
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader
        title="Swap Matches"
        rightContent={
          <button
            onClick={() => navigate('/swap')}
            className="rounded-[12px] font-ui text-xs px-3 py-2 border-[0.5px] border-grove-moss text-grove-cream hover:border-grove-fernLine flex items-center gap-1.5"
          >
            <Repeat className="h-3.5 w-3.5" />
            Deck
          </button>
        }
      />

      <div className="max-w-[600px] mx-auto px-4 pt-4 space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-grove-moss border-[0.5px] border-grove-moss flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-grove-sprout" />
            </div>
            <h2 className="font-plant text-grove-cream text-lg mb-1">No matches yet</h2>
            <p className="font-ui text-sm text-grove-cream mb-4">
              Keep swiping the deck — when someone likes your plants back, you'll match here.
            </p>
            <button
              onClick={() => navigate('/swap')}
              className="rounded-[12px] font-ui text-xs px-4 py-2.5 bg-grove-lime text-grove-root hover:bg-grove-sprout"
            >
              Browse deck
            </button>
          </div>
        ) : (
          matches.map(({ match, other_user, their_plant, unread_messages }) => (
            <button
              key={match.id}
              onClick={() => navigate(`/swaps/${match.id}`)}
              className="w-full rounded-[14px] border-[0.5px] border-grove-moss bg-grove-canopy p-4 flex items-center gap-3 text-left hover:border-grove-fernLine transition-colors duration-150"
            >
              {/* Plant thumbnail */}
              <div className="w-14 h-14 rounded-[10px] bg-grove-moss flex-shrink-0 overflow-hidden flex items-center justify-center">
                {their_plant?.photo_url ? (
                  <img
                    src={getFileUrl(their_plant.photo_url)}
                    alt={their_plant.common_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="h-6 w-6 text-grove-sprout opacity-30" />
                )}
              </div>

              {/* Match info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-plant text-grove-cream text-sm truncate">
                    {their_plant?.nickname || their_plant?.common_name || 'Plant'}
                  </p>
                  <StatusPill status={match.status} />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-ui text-xs text-grove-sage">
                    with @{other_user?.username || 'grower'}
                  </span>
                  {other_user && (
                    <VerifiedProBadge
                      verified_user={other_user.verified_user}
                      verified_by_admin={other_user.verified_by_admin}
                      size={10}
                    />
                  )}
                </div>
                {their_plant?.latin_name && (
                  <p className="font-latin italic text-xs text-grove-lichen mt-0.5 truncate">
                    {their_plant.latin_name}
                  </p>
                )}
              </div>

              {/* Right side: unread badge + chevron */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {unread_messages > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-grove-lime text-grove-root font-ui text-xs">
                    {unread_messages > 9 ? '9+' : unread_messages}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-grove-sage" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const config = {
    matched: { label: 'Matched', bg: 'bg-grove-moss', text: 'text-grove-sprout', border: 'border-grove-fernLine' },
    messaging: { label: 'Chatting', bg: 'bg-grove-moss', text: 'text-grove-sprout', border: 'border-grove-fernLine' },
    confirmed: { label: 'Confirmed', bg: 'bg-grove-sun/15', text: 'text-grove-sun', border: 'border-grove-moss' },
  };
  const c = config[status] || config.matched;
  return (
    <span className={`inline-flex items-center rounded-[20px] border-[0.5px] ${c.border} ${c.bg} px-1.5 py-0.5 font-latin text-xs ${c.text}`}>
      {c.label}
    </span>
  );
}
