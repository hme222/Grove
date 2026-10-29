import React, { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import { useNavigate } from 'react-router-dom';
import { swapsAPI, getFileUrl } from '../lib/api';
import { PageHeader, HeaderAction } from '../components/PageHeader';
import { LoadErrorPage } from '../components/LoadError';
import { Repeat, Leaf, ChevronRight, Sparkles } from 'lucide-react';
import VerifiedProBadge from '../components/VerifiedProBadge';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

export default function SwapMatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = async () => {
    setLoadError(false);
    try {
      const res = await swapsAPI.getMatches();
      setMatches(res.data.matches || []);
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loadError) {
    return <LoadErrorPage title="Swap matches" what="your matches" back={{ to: '/swap', where: 'swaps' }} onRetry={load} />;
  }
  if (loading) {
    return (
      <div>
        <PageHeader back title="Swap matches" />
        <Loading label="Loading matches" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader back
        title="Swap matches"
      />

      <div className="max-w-column mx-auto px-4 pt-4 space-y-3">
        {matches.length > 0 && (
          <div className="flex items-center justify-end">
            <HeaderAction icon={Repeat} onClick={() => navigate('/swap')} data-testid="swap-matches-deck-button">
              Back to deck
            </HeaderAction>
          </div>
        )}
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-pill bg-grove-moss border-hairline border-grove-moss flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-grove-sprout" />
            </div>
            <h2 className="font-plant text-grove-cream text-base font-semibold mb-1">No matches yet</h2>
            <p className="font-ui text-sm text-grove-cream mb-4">
              Keep swiping the deck. When someone likes your plants back, you'll match here.
            </p>
            <button
              onClick={() => navigate('/swap')}
              className={cn(buttonVariants())}
            >
              Browse deck
            </button>
          </div>
        ) : (
          matches.map(({ match, other_user, their_plant, unread_messages }) => (
            <button
              key={match.id}
              onClick={() => navigate(`/swaps/${match.id}`)}
              className="w-full rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 flex items-center gap-3 text-left hover:border-grove-fernLine transition-colors duration-150"
            >
              {/* Plant thumbnail */}
              <div className="w-14 h-14 rounded-chip bg-grove-moss flex-shrink-0 overflow-hidden flex items-center justify-center">
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
                  <p className="font-ui text-grove-cream text-sm font-medium truncate">
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
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-pill bg-grove-lime text-grove-root font-ui text-xs">
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
    <span className={`inline-flex items-center rounded-pill border-hairline ${c.border} ${c.bg} px-2.5 py-1 min-h-6 font-ui text-xs ${c.text}`}>
      {c.label}
    </span>
  );
}
