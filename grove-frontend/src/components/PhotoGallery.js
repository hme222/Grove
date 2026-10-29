import React, { useState, useEffect, useCallback, useRef } from 'react';
import Loading from './Loading';
import { plantAPI, getFileUrl } from '../lib/api';
import LoadError from './LoadError';
import ConfirmDialog from './ConfirmDialog';
import { toast } from 'sonner';
import { Upload, Star, Calendar, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import PhotoViewer from './PhotoViewer';
import PhotoBand from './PhotoBand';

/**
 * Phase 14A.2 — Photo gallery for a plant.
 *
 * - Up to 10 photos per plant (enforced server-side)
 * - Each photo has `taken_at` (user-editable), so the upcoming photo-driven
 *   growth timeline (Phase 14B) can render chronologically.
 * - Cover photo is the hero image shown across the app (Collection tile, etc.)
 */
export default function PhotoGallery({ plantId, plantName, onChanged }) {
  const [photos, setPhotos] = useState([]);
  const [count, setCount] = useState(0);
  const [cap, setCap] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(null); // photo id awaiting delete confirmation
  const [editing, setEditing] = useState(null); // photo being edited
  const [viewerId, setViewerId] = useState(null); // photo open in the paged viewer
  const fileInputRef = useRef(null);
  const [pendingTakenAt, setPendingTakenAt] = useState('');

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await plantAPI.listPhotos(plantId);
      setPhotos(res.data.photos || []);
      setCount(res.data.count || 0);
      setCap(res.data.cap || 10);
      setLoadFailed(false);
    } catch (_e) {
      // A failed request is a load error, never "No photos yet".
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleAddClick = () => {
    if (loadFailed) return; // Add photo is aria-disabled until the photos load
    setPendingTakenAt(''); // empty = "now" by default
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (count >= cap) {
      toast.error(`Photo limit reached (${cap}). Delete one first.`);
      return;
    }
    const form = new FormData();
    form.append('file', file);
    if (pendingTakenAt) form.append('taken_at', pendingTakenAt);
    setUploading(true);
    try {
      await plantAPI.addPhoto(plantId, form);
      toast.success('Photo added');
      await fetchPhotos();
      onChanged?.();
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Upload failed';
      toast.error(detail);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const performDelete = async (photoId) => {
    try {
      await plantAPI.deletePhoto(plantId, photoId);
      toast.success('Photo deleted');
      await fetchPhotos();
      onChanged?.();
    } catch (_e) {
      toast.error('Delete failed');
    }
  };

  const handleSetCover = async (photoId) => {
    try {
      await plantAPI.updatePhoto(plantId, photoId, { is_cover: true });
      toast.success('Cover updated');
      await fetchPhotos();
      onChanged?.();
    } catch (_e) {
      toast.error('Failed to update cover');
    }
  };

  const saveEdit = async (patch) => {
    if (!editing) return;
    try {
      await plantAPI.updatePhoto(plantId, editing.id, patch);
      toast.success('Photo updated');
      setEditing(null);
      await fetchPhotos();
      onChanged?.();
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Update failed';
      toast.error(detail);
    }
  };

  const formatWhen = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return '—'; }
  };

  // The pill on a 98px tile: month and day only, on one line. The full date is in the pill's title,
  // its screen reader text, the Open button's label and the viewer.
  const formatShort = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  // For the date input we need YYYY-MM-DD
  const isoToDateInput = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
  };

  return (
    <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="photo-gallery">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-plant text-grove-cream text-base font-semibold ">Photos</h3>
          {loadFailed ? (
            <p id="photo-gallery-add-reason" className="font-ui text-sm text-grove-sage mt-0.5" data-testid="photo-gallery-add-reason">
              Photos have to load before you can add one.
            </p>
          ) : !loading && (
            <p className="font-ui text-sm text-grove-sage mt-0.5" data-testid="photo-gallery-caption">
              {count} of {cap} · each photo feeds the growth timeline.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddClick}
          disabled={uploading || (!loadFailed && count >= cap)}
          aria-disabled={loadFailed ? 'true' : undefined}
          aria-describedby={loadFailed ? 'photo-gallery-add-reason' : undefined}
          data-testid="photo-gallery-add"
          className={cn(buttonVariants(), "flex shrink-0 gap-1.5 whitespace-nowrap", loadFailed && "cursor-not-allowed opacity-50")}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {uploading ? 'Uploading…' : 'Add photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          data-testid="photo-gallery-file-input"
        />
      </div>

      {loading ? (
        <Loading label="Loading photos" className="py-8" />
      ) : loadFailed && photos.length === 0 ? (
        <LoadError what="photos" compact onRetry={fetchPhotos} testId="photo-gallery-error" />
      ) : photos.length === 0 ? (
        <div
          className="rounded-chip border-hairline border-dashed border-grove-fernLine bg-grove-forest p-5 text-center"
          data-testid="photo-gallery-empty"
        >
          <p className="font-ui text-grove-cream text-sm font-medium">No photos yet</p>
          <p className="font-ui text-xs text-grove-sage mt-1 leading-snug">
            Add a photo every few weeks. The timeline turns them into a visible story of growth.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2" data-testid="photo-gallery-grid">
          {photos.map((p) => (
            <div key={p.id} className="relative" data-testid={`photo-tile-${p.id}`}>
              <button
                type="button"
                onClick={() => setViewerId(p.id)}
                aria-label={`Open photo${p.taken_at ? ` from ${formatWhen(p.taken_at)}` : ''}`}
                data-testid={`photo-open-${p.id}`}
                className="block w-full rounded-chip overflow-hidden border-hairline border-grove-moss bg-grove-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-cream"
              >
                <PhotoBand src={getFileUrl(p.path)} aspect="square" className="rounded-none" testId="photo-tile-image" />
              </button>
              {p.is_cover && (
                <span
                  className="pointer-events-none absolute top-1.5 left-1.5 inline-flex min-h-6 items-center gap-1 whitespace-nowrap rounded-pill bg-grove-lime px-2.5 py-1 text-xs font-ui text-grove-root"
                  data-testid="photo-cover-badge"
                >
                  <Star className="h-2.5 w-2.5 fill-current" /> Cover
                </span>
              )}
              <div className="pointer-events-none absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
                <span
                  className="inline-flex min-h-6 items-center gap-1 whitespace-nowrap rounded-pill bg-grove-root px-2.5 py-1 text-xs font-ui text-grove-cream"
                  title={formatWhen(p.taken_at)}
                  data-testid="photo-date-pill"
                >
                  <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
                  <span aria-hidden="true">{formatShort(p.taken_at)}</span>
                  <span className="sr-only">{p.taken_at ? formatWhen(p.taken_at) : 'No date'}</span>
                </span>
              </div>
            </div>
          ))}
          {count < cap && !loading && !loadFailed && (
            <button
              type="button"
              onClick={handleAddClick}
              disabled={uploading}
              data-testid="photo-gallery-add-tile"
              className="aspect-square rounded-chip border-hairline border-dashed border-grove-fernLine bg-grove-forest flex flex-col items-center justify-center text-grove-sage hover:border-grove-fernLine hover:text-grove-cream transition-colors duration-150"
            >
              <Upload className="h-4 w-4 mb-1" />
              <span className="text-xs font-ui">Add</span>
            </button>
          )}
        </div>
      )}

      <PhotoViewer
        open={viewerId != null && photos.length > 0}
        onOpenChange={(o) => { if (!o) setViewerId(null); }}
        photos={photos.map((p) => ({ id: p.id, path: p.path, taken_at: p.taken_at, caption: p.caption, is_cover: p.is_cover }))}
        startId={viewerId}
        plantName={plantName}
        onEdit={(v) => { setViewerId(null); setEditing(photos.find((p) => p.id === v.id) || null); }}
        onDelete={(v) => performDelete(v.id)}
        onSetCover={(v) => handleSetCover(v.id)}
      />

      {/* Edit photo modal (caption + taken_at) */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="bg-grove-canopy border-hairline border-grove-moss rounded-small max-w-sm" data-testid="photo-edit-modal">
          <DialogHeader>
            <DialogTitle className="font-plant text-grove-cream text-lg">Edit photo</DialogTitle>
          </DialogHeader>
          {editing && (
            <PhotoEditForm
              photo={editing}
              onCancel={() => setEditing(null)}
              onSave={saveEdit}
              isoToDateInput={isoToDateInput}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={pending != null}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title="Delete this photo?"
        description="The photo is removed from this plant’s journal. This can’t be undone."
        confirmLabel="Delete photo"
        testId="photo-delete-confirm"
        onConfirm={() => { const t = pending; setPending(null); performDelete(t); }}
      />
    </div>
  );
}

function PhotoEditForm({ photo, onCancel, onSave, isoToDateInput }) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [takenAt, setTakenAt] = useState(isoToDateInput(photo.taken_at));
  return (
    <div className="space-y-3">
      <PhotoBand src={getFileUrl(photo.path)} ratio="photo" fit="contain" className="rounded-chip border-hairline border-grove-moss" testId="photo-edit-preview" />
      <div>
        <label htmlFor="photo-edit-takenat-input" className="block font-ui text-xs text-grove-cream mb-1">
          Taken on
        </label>
        <input id="photo-edit-takenat-input"
          type="date"
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
          data-testid="photo-edit-takenat"
          className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-3 py-2 text-sm font-ui text-grove-cream focus:outline-none focus:ring-2 focus:ring-grove-lime"
          max={new Date().toISOString().slice(0, 10)}
        />
        <p className="font-latin text-xs text-grove-lichen mt-1">Used to sort photos chronologically in the growth timeline.</p>
      </div>
      <div>
        <label htmlFor="photo-edit-caption-input" className="block font-ui text-xs text-grove-cream mb-1">
          Caption
        </label>
        <textarea id="photo-edit-caption-input"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What&#39;s happening in this photo?"
          data-testid="photo-edit-caption"
          className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset p-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime resize-none h-20"
          maxLength={280}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          data-testid="photo-edit-cancel"
          className={cn(buttonVariants({ variant: 'outline' }), "flex-1 flex")}
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const patch = { caption };
            if (takenAt) {
              // Convert YYYY-MM-DD back to ISO
              patch.taken_at = new Date(`${takenAt}T12:00:00Z`).toISOString();
            }
            onSave(patch);
          }}
          data-testid="photo-edit-save"
          className={cn(buttonVariants(), "flex-1 flex")}
        >
          <Check className="h-3.5 w-3.5" />
          Save
        </button>
      </div>
    </div>
  );
}
