import LoadError from '../components/LoadError';
import { LoadingList } from '../components/Loading';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

import { AppLink } from '../components/AppLink';
import { groveAPI } from '../lib/api';
import { PageHeader, HeaderAction, EmptyState } from '../components/PageHeader';
import { toast } from 'sonner';
import { Plus, Users, ChevronRight, Globe, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function GrovesPage() {
  const [myGroves, setMyGroves] = useState([]);
  const [discoverGroves, setDiscoverGroves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
      setLoadError(false);
    } catch (e) {
      setLoadError(true);
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
      toast.success(`${newGrove.name} created`);
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
      toast.success('Joined grove');
      fetchGroves();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to join');
    }
  };

  // Try again keeps the error card up (it says "Trying again…") until the request settles, so a retry
  // can never flash an empty list or a zero.
  const retryLoad = async () => {
    await fetchGroves();
    document.getElementById('main-content')?.focus();
  };

  return (
    <div>
      <PageHeader back
        title="Groves"
      />

      <div className="max-w-column mx-auto px-4 py-4 space-y-6">
        {!loadError && (
          <div className="flex items-center justify-end">
            <HeaderAction icon={Plus} onClick={() => setShowCreate(true)} data-testid="create-grove-button">
              Create grove
            </HeaderAction>
          </div>
        )}
        {loadError && !loading ? (<LoadError what="groves" onRetry={retryLoad} />) : loading ? (
          <LoadingList label="Loading groves" />
        ) : (
          <>
            {/* My Groves */}
            <div>
              <h2 className="font-plant text-grove-cream text-xl font-semibold mb-3">My groves{myGroves.length > 0 && <span className="ml-2 font-ui text-sm font-normal text-grove-sage">{myGroves.length}</span>}</h2>
              {myGroves.length === 0 ? (
                <EmptyState
                  title="No groves yet"
                  description="Create or join a grove to connect with fellow growers."
                />
              ) : (
                <div className="space-y-2">
                  {myGroves.map(grove => (
                    <AppLink
                      key={grove.id}
                      to={`/groves/${grove.id}`}
                      data-testid="grove-card"
                      className="w-full flex items-center gap-3 rounded-small border-hairline border-grove-lime/25 bg-grove-moss px-4 py-3 text-left hover:border-grove-lime transition-colors duration-150"
                    >
                      <div className="w-10 h-10 rounded-full bg-grove-moss flex items-center justify-center flex-shrink-0 border-hairline border-grove-lime/25">
                        <Users className="h-5 w-5 text-grove-sprout" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-ui text-grove-cream text-sm font-medium truncate">{grove.name}</p>
                          {grove.is_private && <Lock className="h-3 w-3 text-grove-sage" />}
                        </div>
                        <p className="font-ui text-xs text-grove-cream">
                          {grove.member_count} member{grove.member_count !== 1 ? 's' : ''}
                          {grove.user_role === 'admin' && ' · Admin'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-grove-sage flex-shrink-0" />
                    </AppLink>
                  ))}
                </div>
              )}
            </div>

            {/* Discover */}
            {discoverGroves.length > 0 && (
              <div>
                <h2 className="font-plant text-grove-cream text-xl font-semibold mb-3">Discover groves</h2>
                <div className="space-y-2">
                  {discoverGroves.map(grove => (
                    <div
                      key={grove.id}
                      className="flex items-center gap-3 rounded-small border-hairline border-grove-moss bg-grove-moss px-4 py-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-grove-moss flex items-center justify-center flex-shrink-0">
                        <Globe className="h-5 w-5 text-grove-sprout" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-grove-cream text-sm font-medium truncate">{grove.name}</p>
                        <p className="font-ui text-xs text-grove-cream">{grove.member_count} {grove.member_count === 1 ? 'member' : 'members'}</p>
                        {grove.description && (
                          <p className="font-ui text-xs text-grove-sage truncate mt-0.5">{grove.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleJoin(grove.id)}
                        data-testid="grove-join-button"
                        className={cn(buttonVariants(), "flex-shrink-0")}
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
        <DialogContent className="bg-grove-moss border-hairline border-grove-moss rounded-small max-w-md">
          <DialogHeader>
            <DialogTitle className="font-plant text-grove-cream text-lg">Create a grove</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label htmlFor="groves-name" className="font-ui text-xs text-grove-cream block mb-1.5">Name</label>
              <input id="groves-name" aria-label="Name"
                type="text"
                value={newGrove.name}
                onChange={(e) => setNewGrove(prev => ({...prev, name: e.target.value}))}
                data-testid="grove-name-input"
                className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-4 py-3 text-sm font-ui placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                placeholder="e.g., Portland Plant People"
              />
            </div>
            <div>
              <label htmlFor="groves-description" className="font-ui text-xs text-grove-cream block mb-1.5">Description</label>
              <textarea id="groves-description" aria-label="Description"
                value={newGrove.description}
                onChange={(e) => setNewGrove(prev => ({...prev, description: e.target.value}))}
                className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-4 py-3 text-sm font-ui placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime resize-none h-20"
                placeholder="What's your grove about?"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newGrove.is_private}
                onChange={(e) => setNewGrove(prev => ({...prev, is_private: e.target.checked}))}
                className="rounded border-grove-moss"
              />
              <span className="font-ui text-xs text-grove-cream">Private grove (invite only)</span>
            </label>
            <button
              onClick={handleCreate}
              disabled={creating || !newGrove.name.trim()}
              data-testid="grove-create-submit"
              className={cn(buttonVariants(), "w-full disabled:opacity-50")}
            >
              {creating ? 'Creating…' : 'Create grove'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
