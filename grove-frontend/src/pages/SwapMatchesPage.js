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
          <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
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
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] hover:border-[#3B6D11] flex items-center gap-1.5"
          >
            <Repeat className="h-3.5 w-3.5" />
            Deck
          </button>
        }
      />

      <div className="max-w-[600px] mx-auto px-4 pt-4 space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#EAF3DE] border-[0.5px] border-[#D3C9B8] flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-[#3B6D11]" />
            </div>
            <h2 className="font-plant text-[#1C2E10] text-lg mb-1">No matches yet</h2>
            <p className="font-ui text-sm text-[#2B2B26] mb-4">
              Keep swiping the deck — when someone likes your plants back, you'll match here.
            </p>
            <button
              onClick={() => navigate('/swap')}
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-4 py-2.5 bg-[#3B6D11] text-[#F5F0E8] hover:bg-[#2D5016]"
            >
              Browse deck
            </button>
          </div>
        ) : (
          matches.map(({ match, other_user, their_plant, unread_messages }) => (
            <button
              key={match.id}
              onClick={() => navigate(`/swaps/${match.id}`)}
              className="w-full rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4 flex items-center gap-3 text-left hover:border-[#3B6D11] transition-colors duration-150"
            >
              {/* Plant thumbnail */}
              <div className="w-14 h-14 rounded-[10px] bg-[#EAF3DE] flex-shrink-0 overflow-hidden flex items-center justify-center">
                {their_plant?.photo_url ? (
                  <img
                    src={getFileUrl(their_plant.photo_url)}
                    alt={their_plant.common_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="h-6 w-6 text-[#3B6D11] opacity-30" />
                )}
              </div>

              {/* Match info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-plant text-[#1C2E10] text-sm truncate">
                    {their_plant?.nickname || their_plant?.common_name || 'Plant'}
                  </p>
                  <StatusPill status={match.status} />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-ui text-[11px] text-[#5F5E5A]">
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
                  <p className="font-latin italic text-[10px] text-[#888780] mt-0.5 truncate">
                    {their_plant.latin_name}
                  </p>
                )}
              </div>

              {/* Right side: unread badge + chevron */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {unread_messages > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B6D11] text-white font-ui text-[10px]">
                    {unread_messages > 9 ? '9+' : unread_messages}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-[#D3C9B8]" />
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
    matched: { label: 'Matched', bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]', border: 'border-[#3B6D11]' },
    messaging: { label: 'Chatting', bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]', border: 'border-[#3B6D11]' },
    confirmed: { label: 'Confirmed', bg: 'bg-[#FBF1E1]', text: 'text-[#BA7517]', border: 'border-[#BA7517]' },
  };
  const c = config[status] || config.matched;
  return (
    <span className={`inline-flex items-center rounded-[20px] border-[0.5px] ${c.border} ${c.bg} px-1.5 py-0.5 font-latin text-[9px] ${c.text}`}>
      {c.label}
    </span>
  );
}
