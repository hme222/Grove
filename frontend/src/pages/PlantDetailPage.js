import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plantAPI, careAPI, roomAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import StatusDot from '../components/StatusDot';
import CareLogModal from '../components/CareLogModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Droplets, Sparkles, Edit2, Trash2, Leaf, X } from 'lucide-react';
import HealthScorePanel from '../components/HealthScorePanel';
import BloomingTimeline from '../components/BloomingTimeline';
import PhotoGallery from '../components/PhotoGallery';
import { InlineText, InlineRoom, InlineStepper } from '../components/InlineEdit';

export default function PlantDetailPage() {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
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
      toast.error('Failed to load plant');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [plantId, navigate]);

  useEffect(() => { fetchPlant(); }, [fetchPlant]);

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

  const handleDelete = async () => {
    if (window.confirm('Archive this plant?')) {
      try {
        await plantAPI.delete(plantId);
        toast.success('Plant archived');
        navigate('/');
      } catch (e) {
        toast.error('Failed to archive plant');
      }
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

  if (loading || !plant) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const photoUrl = getFileUrl(plant.photo_url);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatAction = (action) => {
    const labels = { water: 'Watered', mist: 'Misted', feed: 'Fed', repot: 'Repotted', prune: 'Pruned', propagate: 'Propagated', photo: 'Photo taken', note: 'Note added', top_up: 'Topped up', change_water: 'Water changed', flush: 'Flushed', add_nutrients: 'Nutrients added' };
    return labels[action] || action;
  };

  return (
    <div>
      {/* Header with photo */}
      <div className="relative">
        <div className="aspect-[16/9] sm:aspect-[2/1] bg-[#EAF3DE] overflow-hidden relative">
          {photoUrl ? (
            <div className="w-full h-full bg-[#EAF3DE] flex items-center justify-center"><img src={photoUrl} alt={plant.common_name} className="max-w-full max-h-full w-auto h-auto object-contain" /></div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="h-16 w-16 text-[#3B6D11] opacity-20" />
            </div>
          )}
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            data-testid="plant-detail-back"
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[#1C2E10]/70 flex items-center justify-center text-[#F5F0E8] hover:bg-[#1C2E10] transition-colors duration-150"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {/* Upload photo */}
          <label className="absolute top-4 right-4 cursor-pointer">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <div className="w-9 h-9 rounded-full bg-[#1C2E10]/70 flex items-center justify-center text-[#F5F0E8] hover:bg-[#1C2E10] transition-colors duration-150">
              <Edit2 className="h-4 w-4" />
            </div>
          </label>
        </div>

        {/* Plant info bar */}
        <div className="bg-[#EDE5D8] border-b-[0.5px] border-[#D3C9B8] px-4 py-3">
          <div className="max-w-[1100px] mx-auto flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StatusDot status={plant.status || 'healthy'} size="lg" showLabel />
              </div>
              <h1 className="font-plant text-[#1C2E10] text-2xl mt-1">
                <InlineText
                  value={plant.nickname || plant.common_name}
                  placeholder={plant.common_name || 'Add nickname'}
                  onSave={(v) => patchPlant({ nickname: v })}
                  testid="plant-nickname"
                  className="text-2xl"
                  inputClassName="text-2xl font-plant text-[#1C2E10]"
                  maxLength={60}
                />
              </h1>
              {plant.latin_name && (
                <p className="font-latin text-[#2B2B26] text-xs mt-0.5">
                  {plant.latin_name}
                  {plant.ai_identified && !plant.ai_species_confirmed && (
                    <span
                      data-testid="plant-ai-identified-badge"
                      className="ml-2 font-mono text-[9px] tracking-[0.05em] text-[#888780] uppercase"
                    >
                      AI identified
                    </span>
                  )}
                  {plant.species_id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/greenhouse/${plant.species_id}`)}
                      data-testid="plant-view-in-greenhouse"
                      className="ml-2 inline-flex items-center text-[10px] font-ui text-[#2D5016] underline underline-offset-2 hover:text-[#1C2E10]"
                    >
                      View in Greenhouse
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
                <span className="inline-flex items-center rounded-[20px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] px-2.5 py-0.5 text-[10px] font-ui text-[#2B2B26]">
                  {plant.grow_medium}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCareModalOpen(true)}
                data-testid="plant-log-care-button"
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] bg-[#3B6D11] text-[#F5F0E8] border-[#3B6D11] hover:bg-[#639922] transition-colors duration-150 flex items-center gap-1.5"
              >
                <Droplets className="h-3.5 w-3.5" />
                Log Care
              </button>
              <button
                onClick={handleDelete}
                data-testid="plant-delete-button"
                className="w-8 h-8 rounded-[2px] border-[0.5px] border-[#D3C9B8] flex items-center justify-center text-[#E24B4A] hover:bg-[#E24B4A] hover:text-[#F5F0E8] transition-colors duration-150"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1100px] mx-auto px-4 py-4" data-testid="plant-detail-tabs">
        <Tabs defaultValue="timeline">
          <TabsList className="bg-transparent border-b-[0.5px] border-[#D3C9B8] rounded-none w-full justify-start gap-1 h-auto p-0">
            <TabsTrigger value="timeline" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#EAF3DE] data-[state=active]:text-[#1C2E10] text-xs font-ui px-4 py-2">Timeline</TabsTrigger>
            <TabsTrigger value="photos" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#EAF3DE] data-[state=active]:text-[#1C2E10] text-xs font-ui px-4 py-2" data-testid="plant-tab-photos">Photos</TabsTrigger>
            <TabsTrigger value="care" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#EAF3DE] data-[state=active]:text-[#1C2E10] text-xs font-ui px-4 py-2">Care</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#EAF3DE] data-[state=active]:text-[#1C2E10] text-xs font-ui px-4 py-2">Notes</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#EAF3DE] data-[state=active]:text-[#1C2E10] text-xs font-ui px-4 py-2">Stats</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="pt-4">
            <BloomingTimeline
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
            <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4">
              <h3 className="font-plant text-[#1C2E10] text-sm mb-2">Watering schedule</h3>
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
                    className="font-plant italic text-[11px] text-[#5F5E5A] mt-1 leading-snug"
                  >
                    {plant.watering_frequency_source === 'ai' ? 'AI-suggested' : 'Your schedule'}
                  </p>
                </div>
                <button
                  onClick={handleAISchedule}
                  disabled={generatingSchedule}
                  data-testid="ai-schedule-button"
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] disabled:opacity-50 transition-colors duration-150 flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  {generatingSchedule ? 'Analyzing...' : 'AI Suggest'}
                </button>
              </div>
              {aiSchedule && (
                <div className="mt-3 rounded-[8px] bg-[#EAF3DE] p-3 border-[0.5px] border-[#D3C9B8]">
                  <p className="font-ui text-sm text-[#1C2E10]">AI suggests every {aiSchedule.days} days</p>
                  <p className="font-ui text-xs text-[#2B2B26] mt-1">{aiSchedule.reason}</p>
                  <p className="font-latin text-[10px] text-[#D3C9B8] mt-1">Confidence: {aiSchedule.confidence}</p>
                </div>
              )}
            </div>

            {/* Last watered */}
            <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4">
              <h3 className="font-plant text-[#1C2E10] text-sm mb-1">Last Watered</h3>
              <p className="font-ui text-sm text-[#1A1A17]">{formatDate(plant.last_watered_at)}</p>
              <p className="font-latin text-[10px] text-[#2B2B26] mt-0.5">Next due: {formatDate(plant.next_water_due)}</p>
            </div>

            {/* Biography */}
            <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#1C2E10] p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-plant text-[#9FE1CB] text-sm">Plant Biography</h3>
                <button
                  onClick={handleGenerateBiography}
                  disabled={generatingBio}
                  data-testid="generate-biography-button"
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 border-[0.5px] border-[#5DCAA5] text-[#9FE1CB] hover:bg-[#2D5016] disabled:opacity-50 transition-colors duration-150 flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  {generatingBio ? 'Writing...' : biography ? 'Regenerate' : 'Generate'}
                </button>
              </div>
              {biography ? (
                <p className="font-ui text-sm text-[#9FE1CB] leading-relaxed">{biography}</p>
              ) : (
                <p className="font-ui text-xs text-[#D3C9B8]">Generate an AI biography that tells this plant's story.</p>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="pt-4">
            <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4">
              <h3 className="font-plant text-[#1C2E10] text-sm mb-2">Notes</h3>
              <p className="font-ui text-sm text-[#1A1A17] whitespace-pre-wrap">
                {plant.notes || 'No notes yet. Add notes from the edit view.'}
              </p>
            </div>
            <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4 mt-3">
              <h3 className="font-plant text-[#1C2E10] text-sm mb-2">Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-[#2B2B26] uppercase tracking-[0.12em]">Acquired</span>
                  <span className="font-latin text-xs text-[#1A1A17]">{formatDate(plant.acquired_date)}</span>
                </div>
                {plant.acquired_from && (
                  <div className="flex justify-between">
                    <span className="font-ui text-xs text-[#2B2B26] uppercase tracking-[0.12em]">From</span>
                    <span className="font-ui text-xs text-[#1A1A17]">{plant.acquired_from}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-[#2B2B26] uppercase tracking-[0.12em]">Medium</span>
                  <span className="font-ui text-xs text-[#1A1A17]">{plant.grow_medium}</span>
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
              <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4">
              <h3 className="font-plant text-[#1C2E10] text-sm mb-3">Care Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-[#2B2B26]">Care actions logged</span>
                  <span className="font-latin text-xs text-[#1A1A17]">{timeline.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-[#2B2B26]">Watering frequency</span>
                  <span className="font-latin text-xs text-[#1A1A17]">Every {plant.watering_frequency_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-ui text-xs text-[#2B2B26]">Added to collection</span>
                  <span className="font-latin text-xs text-[#1A1A17]">{formatDate(plant.created_at)}</span>
                </div>
              </div>
            </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CareLogModal
        open={careModalOpen}
        onClose={() => setCareModalOpen(false)}
        plantId={plantId}
        plantName={plant.nickname || plant.common_name}
        onLogged={fetchPlant}
      />

      {/* Full entry detail modal */}
      {openEntry && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="timeline-entry-modal"
          onClick={() => setOpenEntry(null)}
          className="fixed inset-0 z-[220] bg-[#1C2E10]/85 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[480px] rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] overflow-hidden"
          >
            <button
              onClick={() => setOpenEntry(null)}
              aria-label="Close"
              data-testid="timeline-entry-modal-close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F5F0E8]/90 text-[#1C2E10] flex items-center justify-center z-10 hover:bg-[#EAF3DE]"
            >
              <X className="h-4 w-4" />
            </button>
            {openEntry.photo_url && (
              <img
                src={getFileUrl(openEntry.photo_url)}
                alt=""
                className="w-full aspect-[4/3] bg-[#EAF3DE] object-contain"
              />
            )}
            <div className="p-4">
              <p className="font-plant text-[#1C2E10] text-lg">
                {openEntry.title || (openEntry.action ? (openEntry.action[0].toUpperCase() + openEntry.action.slice(1)) : 'Entry')}
              </p>
              <p className="font-latin text-[10px] text-[#888780] mt-0.5">
                {new Date(openEntry.logged_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              {openEntry.notes && (
                <p className="italic font-ui text-sm text-[#2B2B26] mt-3">"{openEntry.notes}"</p>
              )}
              {openEntry.subtitle && !openEntry.notes && (
                <p className="font-ui text-sm text-[#2B2B26] mt-3">{openEntry.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
