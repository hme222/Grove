import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../lib/api';
import { PageHeader, EmptyState } from '../components/PageHeader';
import StatusDot from '../components/StatusDot';
import { getFileUrl } from '../lib/api';
import { toast } from 'sonner';
import { Leaf, ChevronRight } from 'lucide-react';

export default function RoomPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await roomAPI.getRooms();
        setRooms(res.data);
      } catch (e) {
        toast.error('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div>
      <PageHeader title="Rooms" count={rooms.length} />

      <div className="max-w-[1100px] mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState
            title="No rooms yet"
            description="Add rooms to your plants to organize them by location."
            action={
              <button
                onClick={() => navigate('/add-plant')}
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-6 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016] transition-colors duration-150"
              >
                Add a Plant
              </button>
            }
          />
        ) : (
          rooms.map(room => (
            <div
              key={room.room}
              className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] overflow-hidden"
              data-testid="room-section"
            >
              {/* Room header */}
              <button
                onClick={() => navigate(`/?room=${room.room}`)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#EAF3DE] transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-plant text-[#1C2E10] text-base">{room.room}</h3>
                  <span className="inline-flex items-center rounded-[20px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] px-2 py-0.5 text-xs font-ui text-[#1A1A17]">
                    {room.count}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#D3C9B8]" />
              </button>

              {/* Plant preview grid */}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {room.plants.slice(0, 4).map((plant, i) => (
                    <button
                      key={plant.id || i}
                      onClick={() => navigate(`/plants/${plant.id}`)}
                      className="relative aspect-square rounded-[8px] overflow-hidden border-[0.5px] border-[#D3C9B8]"
                    >
                      {plant.photo_url ? (
                        <div className="w-full h-full bg-[#EAF3DE] flex items-center justify-center"><img src={getFileUrl(plant.photo_url)} alt="" className="max-w-full max-h-full w-auto h-auto object-contain" /></div>
                      ) : (
                        <div className="w-full h-full bg-[#EAF3DE] flex items-center justify-center">
                          <Leaf className="h-4 w-4 text-[#3B6D11] opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-1 left-1">
                        <StatusDot status={plant.status || 'healthy'} />
                      </div>
                    </button>
                  ))}
                  {room.overflow > 0 && (
                    <div className="aspect-square rounded-[8px] bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] flex items-center justify-center">
                      <span className="text-xs font-ui text-[#2B2B26]">+{room.overflow}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
