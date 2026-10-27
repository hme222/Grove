import LoadError from '../components/LoadError';
import { LoadingList } from '../components/Loading';
import React, { useState, useEffect } from 'react';

import { AppLink } from '../components/AppLink';
import { roomAPI } from '../lib/api';
import { PageHeader, EmptyState } from '../components/PageHeader';
import StatusDot from '../components/StatusDot';
import { getFileUrl } from '../lib/api';
import { toast } from 'sonner';
import { Leaf, ChevronRight } from 'lucide-react';
import { LIGHT_LEVELS, lightHelp, roomSummary } from '../lib/roomLight';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import PhotoBand from '../components/PhotoBand';

export default function RoomPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Optimistic: show the new level straight away, and put the old one back if saving fails.
  const setLight = async (roomName, light) => {
    const previous = rooms;
    setRooms((rs) => rs.map((r) => (r.room === roomName ? { ...r, light, fits: (r.fits || []).map((f) => ({ ...f, fit: null })) } : r)));
    try {
      await roomAPI.setLight(roomName, light);
      const res = await roomAPI.getRooms();
      setRooms(res.data);
    } catch (e) {
      setRooms(previous);
      toast.error('Couldn\u2019t save the light. Try again.');
    }
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadError(false);
        const res = await roomAPI.getRooms();
        setRooms(res.data);
      } catch (e) {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div>
      <PageHeader back title="Rooms" />

      <div className="max-w-page mx-auto px-4 py-4 space-y-4">
        {loadError && !loading ? (<LoadError what="rooms" onRetry={() => window.location.reload()} />) : loading ? (
          <LoadingList label="Loading rooms" />
        ) : rooms.length === 0 ? (
          <EmptyState
            photo="/photos/room-1.jpg"
            title="No rooms yet"
            description="Add rooms to your plants to organize them by location."
            action={
              <AppLink
                to="/add-plant"
                className={cn(buttonVariants())}
              >
                Add a Plant
              </AppLink>
            }
          />
        ) : (
          rooms.map(room => (
            <div
              key={room.room}
              className="rounded-card border-hairline border-grove-moss bg-grove-moss overflow-hidden"
              data-testid="room-section"
            >
              {/* Room header */}
              <AppLink
                to={`/plants?room=${encodeURIComponent(room.room)}`}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-grove-moss transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-plant text-grove-cream text-base font-semibold">{room.room}</h3>
                  <span className="inline-flex items-center rounded-pill border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1 text-xs font-ui text-grove-cream min-h-6">
                    {room.count}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-grove-sage" />
              </AppLink>

              {/* Plant preview grid */}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {room.plants.slice(0, 4).map((plant, i) => (
                    <AppLink
                      key={plant.id || i}
                      to={`/plants/${plant.id}`}
                      state={{ name: plant.nickname || plant.common_name }}
                      className="relative block aspect-square rounded-chip overflow-hidden border-hairline border-grove-moss"
                    >
                      {plant.photo_url ? (
                        <PhotoBand src={getFileUrl(plant.photo_url)} aspect="square" className="rounded-none" testId="room-plant-photo" />
                      ) : (
                        <div className="w-full h-full bg-grove-moss flex items-center justify-center">
                          <Leaf className="h-4 w-4 text-grove-sprout opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-1 left-1">
                        <StatusDot status={plant.status || 'healthy'} />
                      </div>
                    </AppLink>
                  ))}
                  {room.overflow > 0 && (
                    <div className="aspect-square rounded-chip bg-grove-forest border-hairline border-grove-moss flex items-center justify-center">
                      <span className="text-xs font-ui text-grove-cream">+{room.overflow}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* How much light the room gets, and whether the plants here suit it */}
              <div className="border-t-hairline border-grove-fernLine/40 px-4 pb-4 pt-3" data-testid="room-light">
                <p id={`light-${room.room}`} className="mb-2 font-ui text-xs text-grove-sage">How much light does {room.room} get?</p>
                <div role="group" aria-labelledby={`light-${room.room}`} className="flex flex-wrap gap-2">
                  {LIGHT_LEVELS.map((l) => {
                    const active = room.light === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setLight(room.room, active ? null : l.id)}
                        data-testid={`room-light-${l.id}`}
                        className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={active}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
                {room.light && <p className="mt-2 font-ui text-xs text-grove-sage">{lightHelp(room.light)}</p>}
                {(() => {
                  const s = roomSummary(room);
                  if (s.tone === 'issues') {
                    return (
                      <ul className="mt-3 space-y-1.5" aria-live="polite" data-testid="room-light-issues">
                        {s.issues.map((t) => <li key={t} className="rounded-control bg-grove-canopy px-3 py-2 font-ui text-sm text-grove-cream">{t}</li>)}
                      </ul>
                    );
                  }
                  return s.text ? <p className={`mt-3 font-ui text-sm ${s.tone === 'good' ? 'text-grove-sprout' : 'text-grove-sage'}`} aria-live="polite" data-testid="room-light-summary">{s.text}</p> : null;
                })()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
