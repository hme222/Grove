import React, { useState, useEffect, useCallback, useRef } from 'react';
import { plantAPI, getFileUrl } from '../lib/api';
import PlantImage from './PlantImage';
import { toast } from 'sonner';
import { Upload, Trash2, Star, Calendar, X, Check, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Phase 14A.2 — Photo gallery for a plant.
 *
 * - Up to 10 photos per plant (enforced server-side)
 * - Each photo has `taken_at` (user-editable), so the upcoming photo-driven
 *   growth timeline (Phase 14B) can render chronologically.
 * - Cover photo is the hero image shown across the app (Collection tile, etc.)
 */
export default function PhotoGallery({ plantId, onChanged }) {
  const [photos, setPhotos] = useState([]);
  const [count, setCount] = useState(0);
  const [cap, setCap] = useState(10);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null); // photo being edited
  const fileInputRef = useRef(null);
  const [pendingTakenAt, setPendingTakenAt] = useState('');

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await plantAPI.listPhotos(plantId);
      setPhotos(res.data.photos || []);
      setCount(res.data.count || 0);
      setCap(res.data.cap || 10);
    } catch (_e) {
      // Gallery may be missing on old plants — don't surface an error.
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleAddClick = () => {
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

  const handleDelete = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
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

  // For the date input we need YYYY-MM-DD
  const isoToDateInput = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
  };

  return (
    <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="photo-gallery">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-plant text-[#1C2E10] text-sm">Photos</h3>
          <p className="font-latin text-[11px] text-[#5F5E5A] mt-0.5">
            {count} of {cap} · each photo feeds the growth timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddClick}
          disabled={uploading || count >= cap}
          data-testid="photo-gallery-add"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] bg-[#3B6D11] text-[#F5F0E8] border-[#3B6D11] hover:bg-[#639922] disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
        >
          <Upload className="h-3 w-3" />
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
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div
          className="rounded-[10px] border border-dashed border-[#D3C9B8] bg-[#F5F0E8] p-6 text-center"
          data-testid="photo-gallery-empty"
        >
          <p className="font-plant text-[#1C2E10] text-sm">No photos yet</p>
          <p className="font-ui text-[11px] text-[#5F5E5A] mt-1 leading-snug">
            Add a photo every few weeks — the timeline turns them into a visible story of growth.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2" data-testid="photo-gallery-grid">
          {photos.map((p) => (
            <div key={p.id} className="relative group" data-testid={`photo-tile-${p.id}`}>
              <div className="aspect-square rounded-[10px] overflow-hidden border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE]">
                <PlantImage src={p.path} tone="plant" rounded="none" className="w-full h-full" />
              </div>
              {p.is_cover && (
                <span
                  className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-[#1C2E10] px-2 py-0.5 text-[9px] font-ui text-[#F5F0E8]"
                  data-testid="photo-cover-badge"
                >
                  <Star className="h-2.5 w-2.5 fill-current" /> Cover
                </span>
              )}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1C2E10]/70 px-2 py-0.5 text-[9px] font-ui text-[#F5F0E8]">
                  <Calendar className="h-2.5 w-2.5" />
                  {formatWhen(p.taken_at)}
                </span>
              </div>
              <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  data-testid={`photo-edit-${p.id}`}
                  aria-label="Edit photo"
                  className="w-6 h-6 rounded-full bg-[#F5F0E8]/95 text-[#1C2E10] flex items-center justify-center hover:bg-[#EAF3DE]"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {!p.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(p.id)}
                    data-testid={`photo-setcover-${p.id}`}
                    aria-label="Set as cover"
                    className="w-6 h-6 rounded-full bg-[#F5F0E8]/95 text-[#1C2E10] flex items-center justify-center hover:bg-[#EAF3DE]"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  data-testid={`photo-delete-${p.id}`}
                  aria-label="Delete photo"
                  className="w-6 h-6 rounded-full bg-[#F5F0E8]/95 text-[#E24B4A] flex items-center justify-center hover:bg-[#E24B4A] hover:text-[#F5F0E8]"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {count < cap && !loading && (
            <button
              type="button"
              onClick={handleAddClick}
              disabled={uploading}
              data-testid="photo-gallery-add-tile"
              className="aspect-square rounded-[10px] border border-dashed border-[#D3C9B8] bg-[#F5F0E8] flex flex-col items-center justify-center text-[#5F5E5A] hover:border-[#3B6D11] hover:text-[#1C2E10] transition-colors duration-150"
            >
              <Upload className="h-4 w-4 mb-1" />
              <span className="text-[10px] font-ui">Add</span>
            </button>
          )}
        </div>
      )}

      {/* Edit photo modal (caption + taken_at) */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="bg-[#FDFAF6] border-[0.5px] border-[#D3C9B8] rounded-[14px] max-w-sm" data-testid="photo-edit-modal">
          <DialogHeader>
            <DialogTitle className="font-plant text-[#1C2E10] text-lg">Edit photo</DialogTitle>
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
    </div>
  );
}

function PhotoEditForm({ photo, onCancel, onSave, isoToDateInput }) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [takenAt, setTakenAt] = useState(isoToDateInput(photo.taken_at));
  return (
    <div className="space-y-3">
      <div className="rounded-[10px] overflow-hidden border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE]">
        <img
          src={getFileUrl(photo.path)}
          alt=""
          className="w-full aspect-[4/3] object-contain bg-[#EAF3DE]"
        />
      </div>
      <div>
        <label className="block font-ui text-[11px] text-[#2B2B26] uppercase tracking-[0.08em] mb-1">
          Taken on
        </label>
        <input
          type="date"
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
          data-testid="photo-edit-takenat"
          className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-3 py-2 text-sm font-ui text-[#1A1A17] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
          max={new Date().toISOString().slice(0, 10)}
        />
        <p className="font-latin text-[10px] text-[#888780] mt-1">Used to sort photos chronologically in the growth timeline.</p>
      </div>
      <div>
        <label className="block font-ui text-[11px] text-[#2B2B26] uppercase tracking-[0.08em] mb-1">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What&#39;s happening in this photo?"
          data-testid="photo-edit-caption"
          className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] p-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5] resize-none h-20"
          maxLength={280}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          data-testid="photo-edit-cancel"
          className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150 flex items-center justify-center gap-2"
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
          className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016] transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <Check className="h-3.5 w-3.5" />
          Save
        </button>
      </div>
    </div>
  );
}
