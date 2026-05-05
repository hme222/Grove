import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, ChevronDown, ChevronUp, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { plantAPI, getFileUrl } from '../lib/api';
import PhotoGuideCards from './PhotoGuideCards';

const GUIDE_OPEN_KEY = 'grove_photo_guide_seen';

/**
 * PhotoRequirement — the mandatory "add a photo" step of the add-plant flow.
 *
 * Props:
 *  - plantName        Display name to personalize the headline
 *  - onPhotoReady     Fired with the uploaded storage path when the user is happy
 *  - onBack           Fired when user taps Back
 */
export default function PhotoRequirement({ plantName, onPhotoReady, onBack }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [uploadingSource, setUploadingSource] = useState(null); // 'camera' | 'gallery' | null
  const [uploadedPath, setUploadedPath] = useState(null);
  const [validation, setValidation] = useState(null); // null | {...}
  const [validating, setValidating] = useState(false);
  const [sourceUsed, setSourceUsed] = useState(null);

  // Guide open-by-default on first add; collapsed afterwards.
  const guideAlreadySeen = typeof window !== 'undefined' && localStorage.getItem(GUIDE_OPEN_KEY) === '1';
  const [guideOpen, setGuideOpen] = useState(!guideAlreadySeen);
  useEffect(() => {
    if (guideOpen && typeof window !== 'undefined') {
      localStorage.setItem(GUIDE_OPEN_KEY, '1');
    }
  }, [guideOpen]);

  const handleFile = async (file, source) => {
    if (!file) return;
    setUploadingSource(source);
    setValidation(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const up = await plantAPI.upload(form);
      const path = up.data.path;
      setUploadedPath(path);
      setSourceUsed(source);
      // Skip AI validation for gallery picks (assume intentional), run for camera
      if (source === 'camera') {
        setValidating(true);
        try {
          const vres = await plantAPI.validatePhoto(path);
          setValidation(vres.data);
        } catch (_) {
          setValidation({ accepted: true, feedback: '' });
        } finally {
          setValidating(false);
        }
      } else {
        setValidation({ accepted: true, feedback: '' });
      }
    } catch (e) {
      toast.error('Photo upload failed');
      setUploadedPath(null);
    } finally {
      setUploadingSource(null);
    }
  };

  const handleAccept = () => {
    if (!uploadedPath) return;
    onPhotoReady(uploadedPath);
  };

  const handleRetry = () => {
    setUploadedPath(null);
    setValidation(null);
  };

  const photoFeedback = validation && !validation.accepted
    ? (validation.feedback || 'Let\'s try another shot — a little more light or a clearer view will help.')
    : null;

  return (
    <div className="max-w-[520px] mx-auto px-4 py-4 space-y-4" data-testid="photo-requirement-screen">
      <button
        type="button"
        onClick={onBack}
        data-testid="photo-back"
        className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] hover:border-[#3B6D11]"
      >
        ← Back
      </button>

      <header>
        <h2 className="font-plant text-[#1C2E10] text-[17px] leading-tight">
          Add a photo of {plantName || 'your plant'}
        </h2>
        <p className="font-ui italic text-[#5F5E5A] text-xs mt-1">
          This becomes {plantName ? `${plantName}'s` : 'their'} profile and the first entry in their story.
        </p>
      </header>

      {/* Viewfinder / preview */}
      <div
        className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] overflow-hidden"
        data-testid="photo-viewfinder"
      >
        {uploadedPath ? (
          <div className="relative">
            <img
              src={getFileUrl(uploadedPath)}
              alt="Uploaded plant preview"
              className="w-full aspect-[4/3] bg-[#EAF3DE] object-contain"
            />
            {validating && (
              <div className="absolute inset-0 bg-[#1C2E10]/60 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-[#9FE1CB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="font-plant text-[#EAF3DE] text-xs">Checking your photo…</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] flex flex-col items-center justify-center text-center px-6">
            <Camera className="h-8 w-8 text-[#3B6D11] mb-2" />
            <p className="font-plant text-[#1C2E10] text-sm">Tap a button below</p>
            <p className="font-ui text-xs text-[#5F5E5A] mt-1">
              Camera opens your device — Library picks an existing photo.
            </p>
          </div>
        )}
      </div>

      {/* Rejection feedback */}
      {photoFeedback && (
        <div
          className="rounded-[12px] border-[0.5px] border-[#D4537E]/40 bg-[#FBEAF0] p-3"
          data-testid="photo-validation-feedback"
        >
          <p className="font-plant text-[#1C2E10] text-sm">We couldn't quite see the plant clearly</p>
          <p className="italic font-ui text-[12px] text-[#5F5E5A] mt-1">"{photoFeedback}"</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              data-testid="photo-try-again"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2 bg-[#3B6D11] text-[#F5F0E8] border-[0.5px] border-[#3B6D11] hover:bg-[#2D5016] flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Try again
            </button>
            <button
              type="button"
              onClick={handleAccept}
              data-testid="photo-use-anyway"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#3B6D11]"
            >
              Use anyway
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!uploadedPath && (
        <div className="grid grid-cols-2 gap-2" data-testid="photo-action-row">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0], 'camera')}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0], 'gallery')}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={!!uploadingSource}
            data-testid="photo-take"
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#3B6D11] text-[#F5F0E8] border-[0.5px] border-[#3B6D11] hover:bg-[#2D5016] disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            <Camera className="h-4 w-4" />
            {uploadingSource === 'camera' ? 'Uploading…' : 'Take photo'}
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={!!uploadingSource}
            data-testid="photo-library"
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#3B6D11] disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            <ImageIcon className="h-4 w-4" />
            {uploadingSource === 'gallery' ? 'Uploading…' : 'Choose existing'}
          </button>
        </div>
      )}

      {/* Accept + retake when photo ready + no rejection */}
      {uploadedPath && !photoFeedback && !validating && (
        <div className="grid grid-cols-2 gap-2" data-testid="photo-ready-row">
          <button
            type="button"
            onClick={handleRetry}
            data-testid="photo-retake"
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#3B6D11] flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Retake
          </button>
          <button
            type="button"
            onClick={handleAccept}
            data-testid="photo-use-this"
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#3B6D11] text-[#F5F0E8] border-[0.5px] border-[#3B6D11] hover:bg-[#2D5016] flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Use this photo
          </button>
        </div>
      )}

      {/* Photo guide (accordion) */}
      <div
        className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] overflow-hidden"
        data-testid="photo-guide-accordion"
      >
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          data-testid="photo-guide-toggle"
          aria-expanded={guideOpen}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F5F0E8] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#3B6D11]" />
            <span className="font-plant text-[#1C2E10] text-sm">How to take a great plant photo</span>
          </span>
          {guideOpen ? <ChevronUp className="h-4 w-4 text-[#2B2B26]" /> : <ChevronDown className="h-4 w-4 text-[#2B2B26]" />}
        </button>
        {guideOpen && (
          <div className="px-3 pb-3 border-t-[0.5px] border-[#D3C9B8]/50 pt-3">
            <PhotoGuideCards />
          </div>
        )}
      </div>
    </div>
  );
}
