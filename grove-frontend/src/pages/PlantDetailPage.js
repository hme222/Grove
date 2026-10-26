import { LoadErrorPage } from '../components/LoadError';
import Loading from '../components/Loading';
import NotFoundPage from './NotFoundPage';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import BackButton from '../components/BackButton';
import { useParams, useNavigate } from 'react-router-dom';
import { plantAPI, roomAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import StatusDot from '../components/StatusDot';
import ToxicityBadge from '../components/ToxicityBadge';
import { confidenceText } from '../lib/aiTrust';
import CareLogModal from '../components/CareLogModal';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Droplets, Sparkles, Camera, Archive, Leaf, X } from 'lucide-react';
import HealthScorePanel from '../components/HealthScorePanel';
import MemoryJournal from '../components/MemoryJournal';
import PhotoGallery from '../components/PhotoGallery';
import { InlineText, InlineRoom, InlineStepper } from '../components/InlineEdit';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

export default function PlantDetailPage() {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [careModalOpen, setCareModalOpen] = useState(false);
  const [biography, setBiography] = useState(null);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [aiSchedule, setAiSchedule] = useState(null);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [openEntry, setOpenEntry] = useState(null);
  const [rooms, setRooms] = useState([]);

  // Phase 14B.1 — merge plant.photos[] into the timeline so each photo becomes
  // a chronological node sorted by `taken_at`. Photos uploaded via the new
  // gallery flow already have explicit timestamps; legacy single-photo plants
  // get the creation date from the backfill.
  const mergedTimeline = useMemo(() => {
    if (!plant) return timeline || [];
    const photoEntries = (plant.photos || [])
      .filter((p) => p && p.path && p.taken_at)
      .map((p) => ({
        id: `photo-${p.id}`,
        action: 'photo',
        logged_at: p.taken_at,
        photo_url: p.path,
        notes: p.caption || '',
        is_cover: !!p.is_cover,
        _source: 'gallery',
      }));
    // De-dupe: care logs may also reference photo_url with an action='photo';
    // skip gallery photos whose path appears in any care log.
    const careLogPaths = new Set((timeline || [])
      .filter((l) => l.photo_url)
      .map((l) => l.photo_url));
    const dedupedPhotos = photoEntries.filter((p) => !careLogPaths.has(p.photo_url));
    return [...(timeline || []), ...dedupedPhotos];
  }, [plant, timeline]);

  const fetchPlant = useCallback(async () => {
    setLoadError(false);
    try {
      const [plantRes, timelineRes] = await Promise.all([
        plantAPI.getOne(plantId),
        plantAPI.getTimeline(plantId),
      ]);
      setPlant(plantRes.data);
      setTimeline(timelineRes.data);
      // Check for cached biography
      try {
        const bioRes = await plantAPI.getBiography(plantId);
        if (bioRes.data.biography) setBiography(bioRes.data.biography);
      } catch (e) { /* ignore */ }
    } catch (e) {
      // Only a missing plant leaves this screen; an outage keeps the person here with Try again.
      if (e?.response?.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => { fetchPlant(); }, [fetchPlant]);

  // The tab strip and screen-reader history name the plant, not just the app.
  useEffect(() => {
    const name = plant?.nickname || plant?.common_name;
    if (name) document.title = `${name} · FloraGrove`;
  }, [plant]);

  // Phase 14A.2 — fetch the user's existing rooms once for the inline room
  // dropdown. Refreshes whenever the plant updates so newly-created rooms
  // appear immediately.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await roomAPI.getRooms();
        if (!alive) return;
        const names = (res.data || []).map((r) => r.room).filter(Boolean);
        setRooms(names);
      } catch { /* non-blocking */ }
    })();
    return () => { alive = false; };
  }, [plant?.room]);

  const patchPlant = useCallback(async (patch) => {
    try {
      const res = await plantAPI.update(plantId, patch);
      setPlant((prev) => ({ ...(prev || {}), ...res.data }));
      toast.success('Saved');
    } catch (_e) {
      toast.error('Save failed');
      throw _e;
    }
  }, [plantId]);

  const handleGenerateBiography = async () => {
    setGeneratingBio(true);
    try {
      const res = await plantAPI.generateBiography(plantId);
      setBiography(res.data.biography);
      toast.success('Biography generated');
    } catch (e) {
      toast.error('Failed to generate biography');
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleAISchedule = async () => {
    setGeneratingSchedule(true);
    try {
      const res = await plantAPI.getAISchedule(plantId);
      setAiSchedule(res.data);
      toast.success(`AI suggests watering every ${res.data.days} days`);
      fetchPlant();
    } catch (e) {
      toast.error('AI schedule suggestion failed');
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveBtnRef = React.useRef(null);
  const handleArchive = async () => {
    try {
      await plantAPI.delete(plantId);
      toast.success('Plant archived', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try { await plantAPI.restore(plantId); toast.success('Plant restored'); } catch { toast.error("Couldn't restore it. Try again from your collection."); }
          },
        },
      });
      navigate('/plants');
    } catch (e) {
      toast.error("Couldn't archive this plant. Check your connection and try again.");
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await plantAPI.uploadPhoto(plantId, formData);
      toast.success('Photo uploaded');
      fetchPlant();
    } catch (err) {
      toast.error('Photo upload failed');
    }
  };

  if (notFound) return <NotFoundPage />;
  if (loadError) {
    return <LoadErrorPage title="This plant" back={{ to: '/plants', where: 'plants' }} onRetry={fetchPlant} />;
  }
  if (loading || !plant) {
    return (
      <Loading label="Loading your plant" />
    );
  }

  const photoUrl = getFileUrl(plant.photo_url);

  const lastWaterLog = (timeline || [])
    .filter((l) => l.action === 'water' && l.logged_at)
    .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div>
      {/* Header with photo */}
      <div className="relative">
        <div className="w-full h-80 min-h-hero max-h-hero bg-grove-moss overflow-hidden relative">
          {photoUrl ? (
            <div className="w-full h-full bg-grove-moss flex items-center justify-center"><img src={photoUrl} alt={plant.common_name} className="w-full h-full object-cover" /></div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="h-16 w-16 text-grove-sprout opacity-20" />
            </div>
          )}
          {/* Back button */}
          <BackButton variant="overlay" testId="plant-detail-back" className="absolute left-3 top-3" />
          {/* Upload photo */}
          <label className="absolute top-3 right-3 cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-grove-lime">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="peer sr-only" />
            <span className="sr-only">Change plant photo</span>
            <div className="w-11 h-11 rounded-full bg-grove-night/65 backdrop-blur-sm flex items-center justify-center text-grove-cream hover:bg-grove-night/85 transition-colors duration-150" aria-hidden="true">
              <Camera className="h-4 w-4" />
            </div>
          </label>
        </div>

        {/* Plant info bar */}
        <div className="bg-grove-moss border-b-hairline border-grove-moss px-4 py-3">
          <div className="max-w-page mx-auto flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StatusDot status={plant.status || 'healthy'} size="lg" showLabel />
              </div>
              <h1 id="page-title" className="font-plant text-grove-cream text-2xl mt-1">
                <InlineText
                  value={plant.nickname || plant.common_name}
                  placeholder={plant.common_name || 'Add nickname'}
                  onSave={(v) => patchPlant({ nickname: v })}
                  testid="plant-nickname"
                  className="text-2xl"
                  inputClassName="text-2xl font-plant text-grove-cream"
                  maxLength={60}
                />
              </h1>
              {plant.latin_name && (
                <p className="font-latin text-grove-cream text-xs mt-0.5">
                  {plant.latin_name}
                  {plant.ai_identified && !plant.ai_species_confirmed && (
                    <span
                      data-testid="plant-ai-identified-badge"
                      className="ml-2 font-ui text-xs tracking-label text-grove-lichen uppercase"
                    >
                      AI identified
                    </span>
                  )}
                  {plant.species_id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/greenhouse/${plant.species_id}`)}
                      data-testid="plant-view-in-greenhouse"
                      className="ml-2 inline-flex items-center text-xs font-ui text-grove-sprout underline underline-offset-2 hover:text-grove-cream"
                    >
                      View in the plant guide
                    </button>
                  )}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <InlineRoom
                  value={plant.room || ''}
                  options={rooms}
                  onSave={(v) => patchPlant({ room: v })}
                  testid="plant-room"
                />
                <span className="inline-flex items-center rounded-round border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1 text-xs font-ui text-grove-cream min-h-6">
                  Grows in {String(plant.grow_medium || 'soil').replace('_', ' ')}
                </span>
              </div>
              <ToxicityBadge toxicity={plant.species_toxicity} size="sm" className="mt-1.5" testId="plant-toxicity" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCareModalOpen(true)}
                data-testid="plant-log-care-button"
                className={cn(buttonVariants(), "flex gap-1.5 whitespace-nowrap")}
              >
                <Droplets className="h-3.5 w-3.5" />
                Log care
              </button>
              <button type="button"
                ref={archiveBtnRef}
                onClick={() => setArchiveOpen(true)}
                data-testid="plant-archive-button"
                className={cn(buttonVariants({ variant: 'outline' }), "flex gap-1.5")}
              >
                <Archive className="h-4 w-4" aria-hidden="true" />
                Archive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-page mx-auto px-4 py-4" data-testid="plant-detail-tabs">
        <Tabs defaultValue="timeline">
          <TabsList className="bg-transparent border-b-hairline border-grove-moss rounded-none w-full justify-start gap-1 h-auto p-0">
            <TabsTrigger value="timeline" className="rounded-t-inset rounded-b-none data-[state=active]:bg-grove-moss data-[state=active]:text-grove-cream text-xs font-ui px-4 py-2">Journal</TabsTrigger>
            <TabsTrigger value="photos" className="rounded-t-inset rounded-b-none data-[state=active]:bg-grove-moss data-[state=active]:text-grove-cream text-xs font-ui px-4 py-2" data-testid="plant-tab-photos">Photos</TabsTrigger>
            <TabsTrigger value="care" className="rounded-t-inset rounded-b-none data-[state=active]:bg-grove-moss data-[state=active]:text-grove-cream text-xs font-ui px-4 py-2">Care</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-t-inset rounded-b-none data-[state=active]:bg-grove-moss data-[state=active]:text-grove-cream text-xs font-ui px-4 py-2">Notes</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-t-inset rounded-b-none data-[state=active]:bg-grove-moss data-[state=active]:text-grove-cream text-xs font-ui px-4 py-2">Stats</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="pt-4">
            <MemoryJournal
              logs={mergedTimeline}
              plant={plant}
              onOpenEntry={(entry) => setOpenEntry(entry)}
            />
          </TabsContent>

          {/* Photos Tab — Phase 14A.2 */}
          <TabsContent value="photos" className="pt-4">
            <PhotoGallery plantId={plantId} onChanged={fetchPlant} />
          </TabsContent>

          {/* Care Tab */}
          <TabsContent value="care" className="pt-4 space-y-4">
            {/* Watering schedule */}
            <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
              <h3 className="font-plant text-grove-cream text-base font-semibold  mb-2">Watering schedule</h3>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <InlineStepper
                    value={plant.watering_frequency_days || 7}
                    onSave={(v) => patchPlant({ watering_frequency_days: v })}
                    min={1}
                    max={60}
                    testid="watering-stepper"
                  />
                  <p
                    data-testid="watering-schedule-label"
                    className="font-ui italic text-xs font-medium text-grove-sage mt-1 leading-snug"
                  >
                    {plant.watering_frequency_source === 'ai' ? 'AI-suggested' : 'Your schedule'}
                  </p>
                </div>
                <button
                  onClick={handleAISchedule}
                  disabled={generatingSchedule}
                  data-testid="ai-schedule-button"
                  className={cn(buttonVariants({ variant: 'outline' }), "flex gap-1")}
                >
                  <Sparkles className="h-3 w-3" />
                  {generatingSchedule ? 'Analyzing…' : 'AI Suggest'}
                </button>
              </div>
              {aiSchedule && (
                <div className="mt-3 rounded-inset bg-grove-moss p-3 border-hairline border-grove-moss">
                  <p className="font-ui text-sm text-grove-cream">AI suggests every {aiSchedule.days} days</p>
                  {aiSchedule.reason && (
                    <p className="font-ui text-xs text-grove-cream mt-1">
                      <span className="font-semibold">Why: </span>{aiSchedule.reason}
                    </p>
                  )}
                  {confidenceText(aiSchedule.confidence) && (
                    <p data-testid="ai-schedule-confidence" className="font-ui text-xs text-grove-cream mt-1">
                      {confidenceText(aiSchedule.confidence)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Last watered */}
            <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
              <h3 className="font-plant text-grove-cream text-base font-semibold  mb-1">Last watered</h3>
              <p className="font-ui text-sm text-grove-cream">
                {plant.last_watered_at || lastWaterLog ? formatDate(plant.last_watered_at || lastWaterLog.logged_at) : 'Not logged yet'}
              </p>
              <p className="font-latin text-xs text-grove-cream mt-0.5">Next due: {formatDate(plant.next_water_due)}</p>
            </div>

            {/* Biography */}
            <div className="rounded-card border-hairline border-grove-fernLine/40 bg-grove-canopy p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-plant text-grove-sprout text-base font-semibold ">Plant Biography</h3>
                <button
                  onClick={handleGenerateBiography}
                  disabled={generatingBio}
                  data-testid="generate-biography-button"
                  className="rounded-control font-ui text-xs px-3 py-1.5 border-hairline border-grove-lime text-grove-sprout hover:bg-grove-sprout disabled:opacity-50 transition-colors duration-150 flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  {generatingBio ? 'Writing…' : biography ? 'Regenerate' : 'Generate'}
                </button>
              </div>
              {biography ? (
                <p className="font-ui text-sm text-grove-sprout leading-relaxed">{biography}</p>
              ) : (
                <p className="font-ui text-xs text-grove-sage">Generate an AI biography that tells this plant's story.</p>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="pt-4">
            <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
              <h3 className="font-plant text-grove-cream text-base font-semibold  mb-2">Notes</h3>
              <p className="font-ui text-sm text-grove-cream whitespace-pre-wrap">
                {plant.notes || 'No notes yet. Add notes from the edit view.'}
              </p>
            </div>
            <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 mt-3">
              <h3 className="font-plant text-grove-cream text-base font-semibold  mb-2">Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-grove-cream">Acquired</span>
                  <span className="font-latin text-xs text-grove-cream">{formatDate(plant.acquired_date)}</span>
                </div>
                {plant.acquired_from && (
                  <div className="flex justify-between">
                    <span className="font-ui text-xs text-grove-cream">From</span>
                    <span className="font-ui text-xs text-grove-cream">{plant.acquired_from}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-grove-cream">Medium</span>
                  <span className="font-ui text-xs text-grove-cream">{plant.grow_medium}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="pt-4">
            <div className="space-y-3">
              <HealthScorePanel
                breakdown={plant.health_breakdown}
                score={plant.health_score}
                careLogCount={timeline?.length || 0}
              />
              <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
              <h3 className="font-plant text-grove-cream text-base font-semibold  mb-3">Care Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-grove-cream">Care actions logged</span>
                  <span className="font-latin text-xs text-grove-cream">{timeline.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-grove-cream">Watering frequency</span>
                  <span className="font-latin text-xs text-grove-cream">Every {plant.watering_frequency_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-grove-cream">Added to collection</span>
                  <span className="font-latin text-xs text-grove-cream">{formatDate(plant.created_at)}</span>
                </div>
              </div>
            </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent data-testid="archive-dialog" onCloseAutoFocus={(e) => { e.preventDefault(); archiveBtnRef.current?.focus(); }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {plant?.nickname || plant?.common_name || 'this plant'}?</AlertDialogTitle>
            <AlertDialogDescription>
              It leaves your collection and your Today list. Its care history and photos are kept, and you can undo this right after.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="archive-cancel" variant="default">Keep it</AlertDialogCancel>
            <AlertDialogAction variant="outline" data-testid="archive-confirm" onClick={handleArchive}><Archive className="mr-1.5 h-4 w-4" aria-hidden="true" />Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CareLogModal
        open={careModalOpen}
        onClose={() => setCareModalOpen(false)}
        plantId={plantId}
        plantName={plant.nickname || plant.common_name}
        onLogged={fetchPlant}
      />

      {/* Full entry detail */}
      <Dialog open={!!openEntry} onOpenChange={(o) => { if (!o) setOpenEntry(null); }}>
        <DialogContent data-testid="timeline-entry-modal" showClose={false} className="max-w-entry overflow-hidden p-0" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Journal entry</DialogTitle>
          {openEntry && (
            <>
              <button
                type="button"
                onClick={() => setOpenEntry(null)}
                aria-label="Close"
                data-testid="timeline-entry-modal-close"
                className="absolute right-3 top-3 z-raised flex h-touch w-touch items-center justify-center rounded-full bg-grove-forest/90 text-grove-cream hover:bg-grove-moss"
              >
                <X className="h-4 w-4" />
              </button>
              {openEntry.photo_url && (
                <img
                  src={getFileUrl(openEntry.photo_url)}
                  alt=""
                  className="w-full aspect-[4/3] bg-grove-moss object-contain"
                />
              )}
              <div className="p-4">
                <p className="font-plant text-grove-cream text-lg">
                  {openEntry.title || (openEntry.action ? (openEntry.action[0].toUpperCase() + openEntry.action.slice(1)) : 'Entry')}
                </p>
                <p className="font-latin text-xs text-grove-lichen mt-0.5">
                  {new Date(openEntry.logged_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                {openEntry.notes && (
                  <p className="italic font-ui text-sm text-grove-cream mt-3">&ldquo;{openEntry.notes}&rdquo;</p>
                )}
                {openEntry.subtitle && !openEntry.notes && (
                  <p className="font-ui text-sm text-grove-cream mt-3">{openEntry.subtitle}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
