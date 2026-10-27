import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from './Loading';
import { Camera, Image as ImageIcon, ChevronDown, ChevronUp, RotateCcw, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { toast } from 'sonner';
import { plantAPI, getFileUrl } from '../lib/api';
import PhotoGuideCards from './PhotoGuideCards';
import PhotoBand from './PhotoBand';

const GUIDE_OPEN_KEY = 'grove_photo_guide_seen';

/**
 * PhotoRequirement — the mandatory "add a photo" step of the add-plant flow.
 *
 * Props:
 *  - plantName        Display name to personalize the headline
 *  - onPhotoReady     Fired with the uploaded storage path when the user is happy
 *  - onBack           Fired when user taps Back
 */
export default function PhotoRequirement({ plantName, onPhotoReady, onSkip }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [uploadingSource, setUploadingSource] = useState(null); // 'camera' | 'gallery' | null
  const [uploadedPath, setUploadedPath] = useState(null);
  const [validation, setValidation] = useState(null); // null | {...}
  const [validating, setValidating] = useState(false);

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
    <div className="max-w-form mx-auto px-4 py-4 space-y-4" data-testid="photo-requirement-screen">
      <header>
        <h2 className="font-plant text-grove-cream text-lead leading-tight">
          Add a photo of {plantName || 'your plant'}
        </h2>
        <p className="font-ui italic text-grove-sage text-xs mt-1">
          This becomes {plantName ? `${plantName}'s` : 'their'} profile and the first entry in their story.
        </p>
      </header>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          data-testid="photo-skip"
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
        >
          Add without a photo for now
        </button>
      )}

      {/* Viewfinder / preview */}
      <div
        className="rounded-card border-hairline border-grove-moss bg-grove-moss overflow-hidden"
        data-testid="photo-viewfinder"
      >
        {uploadedPath ? (
          <div className="relative">
            <PhotoBand
              src={getFileUrl(uploadedPath)}
              alt="Uploaded plant preview"
              ratio="photo"
              fit="contain"
              className="rounded-none"
              testId="photo-requirement-preview"
            />
            {validating && (
              <div className="absolute inset-0 bg-grove-lime/80 flex items-center justify-center">
                <div className="text-center" role="status">
                  <Spinner className="mx-auto mb-2 block h-6 w-6" />
                  <p className="font-ui text-grove-sprout text-xs font-medium">Checking your photo…</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-photo flex flex-col items-center justify-center text-center px-6">
            <Camera className="h-8 w-8 text-grove-sprout mb-2" />
            <p className="font-ui text-grove-cream text-sm font-medium">Tap a button below</p>
            <p className="font-ui text-xs text-grove-sage mt-1">
              Camera opens your device — Library picks an existing photo.
            </p>
          </div>
        )}
      </div>

      {/* Rejection feedback */}
      {photoFeedback && (
        <div
          className="rounded-control border-hairline border-grove-bloom/40 bg-grove-bloom/15 p-3"
          data-testid="photo-validation-feedback"
        >
          <p className="font-ui text-grove-cream text-sm font-medium">We couldn't quite see the plant clearly</p>
          <p className="italic font-ui text-xs text-grove-sage mt-1">"{photoFeedback}"</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetry}
              data-testid="photo-try-again"
              className={cn(buttonVariants(), "flex items-center gap-1.5")}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Try again
            </button>
            <button
              type="button"
              onClick={handleAccept}
              data-testid="photo-use-anyway"
              className={cn(buttonVariants({ variant: 'outline' }))}
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
            className={cn(buttonVariants(), "flex gap-1.5")}
          >
            <Camera className="h-4 w-4" />
            {uploadingSource === 'camera' ? 'Uploading…' : 'Take photo'}
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={!!uploadingSource}
            data-testid="photo-library"
            className={cn(buttonVariants({ variant: 'outline' }), "flex gap-1.5")}
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
            className={cn(buttonVariants({ variant: 'outline' }), "flex gap-1.5")}
          >
            <RotateCcw className="h-4 w-4" /> Retake
          </button>
          <button
            type="button"
            onClick={handleAccept}
            data-testid="photo-use-this"
            className={cn(buttonVariants(), "flex items-center justify-center gap-1.5")}
          >
            <Check className="h-4 w-4" /> Use this photo
          </button>
        </div>
      )}

      {/* Photo guide (accordion) */}
      <div
        className="rounded-card border-hairline border-grove-moss bg-grove-canopy overflow-hidden"
        data-testid="photo-guide-accordion"
      >
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          data-testid="photo-guide-toggle"
          aria-expanded={guideOpen}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-grove-forest transition-colors"
        >
          <span className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-grove-sprout" />
            <span className="font-ui text-grove-cream text-sm font-medium">How to take a great plant photo</span>
          </span>
          {guideOpen ? <ChevronUp className="h-4 w-4 text-grove-cream" /> : <ChevronDown className="h-4 w-4 text-grove-cream" />}
        </button>
        {guideOpen && (
          <div className="px-3 pb-3 border-t-hairline border-grove-moss/40 pt-3">
            <PhotoGuideCards />
          </div>
        )}
      </div>
    </div>
  );
}
