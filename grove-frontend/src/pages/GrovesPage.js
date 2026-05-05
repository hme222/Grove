import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groveAPI } from '../lib/api';
import { PageHeader, EmptyState } from '../components/PageHeader';
import { toast } from 'sonner';
import { Plus, Users, ChevronRight, Globe, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function GrovesPage() {
  const navigate = useNavigate();
  const [myGroves, setMyGroves] = useState([]);
  const [discoverGroves, setDiscoverGroves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGrove, setNewGrove] = useState({ name: '', description: '', is_private: false });
  const [creating, setCreating] = useState(false);

  const fetchGroves = async () => {
    try {
      const [myRes, discoverRes] = await Promise.all([
        groveAPI.getAll(),
        groveAPI.discover(),
      ]);
      setMyGroves(myRes.data);
      setDiscoverGroves(discoverRes.data);
    } catch (e) {
      toast.error('Failed to load groves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroves(); }, []);

  const handleCreate = async () => {
    if (!newGrove.name.trim()) return;
    setCreating(true);
    try {
      await groveAPI.create(newGrove);
      toast.success(`${newGrove.name} created!`);
      setShowCreate(false);
      setNewGrove({ name: '', description: '', is_private: false });
      fetchGroves();
    } catch (e) {
      toast.error('Failed to create grove');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (groveId) => {
    try {
      await groveAPI.join(groveId);
      toast.success('Joined grove!');
      fetchGroves();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to join');
    }
  };

  return (
    <div>
      <PageHeader
        title="Groves"
        count={myGroves.length}
        rightContent={
          <button
            onClick={() => setShowCreate(true)}
            data-testid="create-grove-button"
            className="rounded-full w-9 h-9 bg-[#5DCAA5] text-white flex items-center justify-center hover:bg-[#4ab08d] transition-colors duration-150"
          >
            <Plus className="h-4 w-4" />
          </button>
        }
      />

      <div className="max-w-[600px] mx-auto px-4 py-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#5DCAA5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* My Groves */}
            <div>
              <h2 className="font-plant text-[#1C2E10] text-base mb-3">My Groves</h2>
              {myGroves.length === 0 ? (
                <EmptyState
                  title="No groves yet"
                  description="Create or join a grove to connect with fellow growers."
                />
              ) : (
                <div className="space-y-2">
                  {myGroves.map(grove => (
                    <button
                      key={grove.id}
                      onClick={() => navigate(`/groves/${grove.id}`)}
                      data-testid="grove-card"
                      className="w-full flex items-center gap-3 rounded-[14px] border-[0.5px] border-[#5DCAA5]/30 bg-[#EDE5D8] px-4 py-3 text-left hover:border-[#5DCAA5] transition-colors duration-150"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#EAF3DE] flex items-center justify-center flex-shrink-0 border-[0.5px] border-[#5DCAA5]/30">
                        <Users className="h-5 w-5 text-[#5DCAA5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-plant text-[#1C2E10] text-sm truncate">{grove.name}</p>
                          {grove.is_private && <Lock className="h-3 w-3 text-[#D3C9B8]" />}
                        </div>
                        <p className="font-ui text-[10px] text-[#2B2B26]">
                          {grove.member_count} member{grove.member_count !== 1 ? 's' : ''}
                          {grove.user_role === 'admin' && ' · Admin'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#D3C9B8] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Discover */}
            {discoverGroves.length > 0 && (
              <div>
                <h2 className="font-plant text-[#1C2E10] text-base mb-3">Discover Groves</h2>
                <div className="space-y-2">
                  {discoverGroves.map(grove => (
                    <div
                      key={grove.id}
                      className="flex items-center gap-3 rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] px-4 py-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#EAF3DE] flex items-center justify-center flex-shrink-0">
                        <Globe className="h-5 w-5 text-[#5DCAA5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-plant text-[#1C2E10] text-sm truncate">{grove.name}</p>
                        <p className="font-ui text-[10px] text-[#2B2B26]">{grove.member_count} members</p>
                        {grove.description && (
                          <p className="font-ui text-[10px] text-[#D3C9B8] truncate mt-0.5">{grove.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleJoin(grove.id)}
                        data-testid="grove-join-button"
                        className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] bg-[#5DCAA5] text-white border-[#5DCAA5] hover:bg-[#4ab08d] flex-shrink-0"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Grove Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#EDE5D8] border-[0.5px] border-[#D3C9B8] rounded-[14px] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-plant text-[#1C2E10] text-lg">Create a Grove</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Name</label>
              <input
                type="text"
                value={newGrove.name}
                onChange={(e) => setNewGrove(prev => ({...prev, name: e.target.value}))}
                data-testid="grove-name-input"
                className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                placeholder="e.g., Portland Plant People"
              />
            </div>
            <div>
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Description</label>
              <textarea
                value={newGrove.description}
                onChange={(e) => setNewGrove(prev => ({...prev, description: e.target.value}))}
                className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5] resize-none h-20"
                placeholder="What's your grove about?"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newGrove.is_private}
                onChange={(e) => setNewGrove(prev => ({...prev, is_private: e.target.checked}))}
                className="rounded border-[#D3C9B8]"
              />
              <span className="font-ui text-xs text-[#1A1A17]">Private grove (invite only)</span>
            </label>
            <button
              onClick={handleCreate}
              disabled={creating || !newGrove.name.trim()}
              data-testid="grove-create-submit"
              className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#5DCAA5] text-white border-[0.5px] border-[#5DCAA5] hover:bg-[#4ab08d] disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Grove'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
