import { LoadErrorPage } from '../components/LoadError';
import Loading from '../components/Loading';
import NotFoundPage from './NotFoundPage';
import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import BackButton from '../components/BackButton';
import { useParams, useLocation } from 'react-router-dom';
import { bouquetAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import { confidenceText } from '../lib/aiTrust';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sparkles, Edit2, Flower2, Droplets, Scissors, Camera, FileText, Share2 } from 'lucide-react';

const BOUQUET_CARE_ACTIONS = [
  { value: 'water_change', label: 'Water change', icon: Droplets },
  { value: 'stem_recut', label: 'Recut stems', icon: Scissors },
  { value: 'remove_flower', label: 'Remove flower', icon: Flower2 },
  { value: 'photo', label: 'Photo', icon: Camera },
  { value: 'note', label: 'Note', icon: FileText },
];

export default function BouquetDetailPage() {
  const { bouquetId } = useParams();
  const knownName = useLocation().state?.name;
  const [bouquet, setBouquet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [carePlan, setCarePlan] = useState(null);
  const [careAction, setCareAction] = useState(null);
  const [careNotes, setCareNotes] = useState('');
  const [loggingCare, setLoggingCare] = useState(false);

  const fetchBouquet = useCallback(async () => {
    try {
      setLoadError(false);
      const res = await bouquetAPI.getOne(bouquetId);
      setBouquet(res.data);
      if (res.data.care_plan) setCarePlan(res.data.care_plan);
    } catch (e) {
      if (e.response?.status === 404) setNotFound(true);
      else setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [bouquetId]);

  useEffect(() => { fetchBouquet(); }, [fetchBouquet]);

  // The tab strip and screen-reader history name the bouquet.
  useEffect(() => {
    const name = bouquet?.name || (loadError ? knownName : null);
    if (name) document.title = `${name} · FloraGrove`;
  }, [bouquet, loadError, knownName]);

  const handleIdentify = async () => {
    setIdentifying(true);
    try {
      const res = bouquet?.photo_url
        ? await bouquetAPI.identify(bouquetId)
        : await bouquetAPI.identifyText(bouquetId);
      toast.success(`Identified ${res.data.flowers?.length || 0} flowers`);
      fetchBouquet();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Identification failed');
    } finally {
      setIdentifying(false);
    }
  };

  const handleCarePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await bouquetAPI.getCarePlan(bouquetId);
      setCarePlan(res.data);
      toast.success('Care plan generated');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Care plan failed');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleLogCare = async () => {
    if (!careAction) return;
    setLoggingCare(true);
    try {
      await bouquetAPI.createCareLog(bouquetId, { action: careAction, notes: careNotes });
      toast.success('Care logged');
      setCareAction(null);
      setCareNotes('');
      fetchBouquet();
    } catch (e) {
      toast.error('Failed to log care');
    } finally {
      setLoggingCare(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await bouquetAPI.uploadPhoto(bouquetId, formData);
      toast.success('Photo uploaded');
      fetchBouquet();
    } catch (err) {
      toast.error('Photo upload failed');
    }
  };

  const handleShare = () => {
    if (bouquet?.public_slug) {
      const url = `${window.location.origin}/bouquet/${bouquet.public_slug}`;
      navigator.clipboard.writeText(url).then(() => toast.success('Link copied'));
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  if (notFound) return <NotFoundPage />;
  if (loadError) {
    return <LoadErrorPage title={knownName || 'Bouquet'} what={knownName ? knownName : undefined} back={{ to: '/bouquets', where: 'bouquets' }} onRetry={fetchBouquet} />;
  }
  if (loading || !bouquet) {
    return <Loading label="Loading your bouquet" />;
  }

  const photoUrl = getFileUrl(bouquet.photo_url);
  const vaseTotal = Number(bouquet.vase_life_expected) || 0;
  const daysAlive = bouquet.received_date
    ? Math.max(1, Math.ceil((Date.now() - new Date(bouquet.received_date).getTime()) / 86400000))
    : 1;
  const dayNumber = Math.min(daysAlive, vaseTotal);

  return (
    <div>
      {/* Header */}
      <div className="relative">
        <div className="aspect-[16/9] bg-grove-canopy overflow-hidden relative">
          {photoUrl ? (
            <div className="w-full h-full flex items-center justify-center"><img src={photoUrl} alt={bouquet.name} className="w-full h-full object-cover" /></div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Flower2 className="h-16 w-16 text-grove-bloom opacity-60" aria-hidden="true" />
            </div>
          )}
          <BackButton variant="overlay" where="bouquets" className="absolute left-3 top-3" />
          <div className="absolute top-4 right-4 flex gap-2">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" aria-label="Change photo" />
              <div className="w-11 h-11 rounded-full bg-grove-night/65 flex items-center justify-center text-grove-cream hover:bg-grove-night/85">
                <Edit2 className="h-4 w-4" />
              </div>
            </label>
            <button aria-label="Share bouquet" onClick={handleShare} className="w-touch h-touch rounded-full bg-grove-night/65 flex items-center justify-center text-grove-cream hover:bg-grove-night/85">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-grove-canopy border-b-hairline border-grove-moss px-4 py-3">
          <div className="max-w-page mx-auto flex items-start justify-between gap-3">
            <div>
              <h1 className="font-plant text-grove-cream text-2xl">{bouquet.name || 'Bouquet'}</h1>
              <div className="flex items-center gap-2 mt-1">
                {bouquet.occasion && (
                  <span className="inline-flex items-center rounded-pill border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1 text-xs font-ui text-grove-cream capitalize min-h-6">{bouquet.occasion}</span>
                )}
                <span className="font-ui text-xs text-grove-sage">{formatDate(bouquet.received_date)}</span>
              </div>
            </div>
            <div className="text-right">
              {vaseTotal > 0 && (
                <div data-testid="bouquet-day-chip" className="inline-flex items-center rounded-pill border-hairline border-grove-fernLine bg-grove-forest px-2.5 py-1 text-grove-cream text-xs font-ui min-h-6">
                  Day {dayNumber} of {vaseTotal}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-page mx-auto px-4 py-4">
        <Tabs defaultValue="flowers">
          <TabsList className="border-b-hairline border-grove-moss">
            <TabsTrigger value="flowers">Flowers</TabsTrigger>
            <TabsTrigger value="care">Care plan</TabsTrigger>
            <TabsTrigger value="log">Log care</TabsTrigger>
          </TabsList>

          {/* Flowers Tab */}
          <TabsContent value="flowers" className="pt-4">
            {(!bouquet.flowers || bouquet.flowers.length === 0) ? (
              <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 text-center">
                <Flower2 className="h-8 w-8 text-grove-bloom opacity-60 mx-auto mb-2" aria-hidden="true" />
                <p className="font-ui text-grove-cream text-sm font-medium">No flowers identified yet</p>
                <p className="font-ui text-xs text-grove-sage mt-1 mb-3">
                  {bouquet.photo_url ? 'AI will analyze your bouquet photo' : 'Upload a photo or use text-based identification'}
                </p>
                <button
                  onClick={handleIdentify}
                  disabled={identifying}
                  data-testid="identify-flowers-button"
                  className={cn(buttonVariants(), "disabled:opacity-50 flex items-center justify-center gap-1.5 mx-auto")}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {identifying ? 'Identifying…' : 'Identify flowers'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-plant text-grove-cream text-base font-semibold ">{bouquet.flowers.length} flowers identified</h3>
                  <button onClick={handleIdentify} disabled={identifying} className="min-h-touch px-2 text-xs font-ui text-grove-sprout hover:text-grove-cream disabled:opacity-50">
                    {identifying ? 'Re-identifying…' : 'Re-identify'}
                  </button>
                </div>
                {bouquet.flowers.map((f, i) => (
                  <div key={f.id || i} className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-ui text-grove-cream text-sm font-medium">{f.common_name}</p>
                        <p className="font-latin text-xs italic text-grove-sage">{f.latin_name}</p>
                      </div>
                      <div className="text-right">
                        {Number(f.vase_life_days) > 0 && (
                          <span className="inline-flex items-center rounded-pill border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1 text-xs font-ui text-grove-cream min-h-6">
                            About {f.vase_life_days} days of vase life
                          </span>
                        )}
                        {confidenceText(f.ai_confidence) && (
                          <p data-testid="bouquet-flower-confidence" className="font-ui text-xs text-grove-sage mt-1">
                            {confidenceText(f.ai_confidence)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-ui text-grove-cream">{f.stem_count || 1} {(f.stem_count || 1) === 1 ? 'stem' : 'stems'}</span>
                    </div>
                    {f.care_instructions && (
                      <p className="font-ui text-xs text-grove-cream mt-2">{f.care_instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Care Plan Tab */}
          <TabsContent value="care" className="pt-4">
            {!carePlan ? (
              <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 text-center">
                <p className="font-ui text-grove-cream text-sm font-medium">No care plan yet</p>
                <p className="font-ui text-xs text-grove-sage mt-1 mb-3">Generate a personalized care plan based on identified flowers.</p>
                <button
                  onClick={handleCarePlan}
                  disabled={generatingPlan || (!bouquet.flowers || bouquet.flowers.length === 0)}
                  data-testid="generate-care-plan-button"
                  className={cn(buttonVariants(), "disabled:opacity-50 flex items-center justify-center gap-1.5 mx-auto")}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingPlan ? 'Generating…' : 'Generate care plan'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {Number(carePlan.vase_life_days) > 0 && (
                  <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 text-center">
                    <p className="font-plant text-grove-cream text-lg">About {carePlan.vase_life_days} days of vase life</p>
                  </div>
                )}
                {carePlan.immediate_steps?.length > 0 && (
                  <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
                    <h3 className="font-plant text-grove-cream text-base font-semibold  mb-2">Do now</h3>
                    <ul className="space-y-1.5">
                      {carePlan.immediate_steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-ui text-grove-cream">
                          <span className="text-grove-sage mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {carePlan.daily_steps?.length > 0 && (
                  <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
                    <h3 className="font-plant text-grove-cream text-base font-semibold  mb-2">Daily care</h3>
                    <ul className="space-y-1.5">
                      {carePlan.daily_steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-ui text-grove-cream">
                          <span className="text-grove-sage mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {carePlan.day_specific?.length > 0 && (
                  <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
                    <h3 className="font-plant text-grove-cream text-base font-semibold  mb-2">Day by day</h3>
                    <div className="space-y-1.5">
                      {carePlan.day_specific.map((d, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="font-ui text-xs text-grove-sprout w-12 flex-shrink-0">Day {d.day}</span>
                          <span className="text-xs font-ui text-grove-cream">{d.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {carePlan.preserve_note && (
                  <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
                    <h3 className="font-plant text-grove-cream text-base font-semibold  mb-1">Preservation</h3>
                    <p className="font-ui text-xs text-grove-cream">{carePlan.preserve_note}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Log Care Tab */}
          <TabsContent value="log" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {BOUQUET_CARE_ACTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setCareAction(value)}
                    aria-pressed={careAction === value}
                    data-testid={`bouquet-care-${value}`}
                    className={`flex min-h-touch flex-col items-center gap-1 p-3 rounded-control border-hairline transition-colors duration-150 ${
                      careAction === value
                        ? 'border-grove-fernLine bg-grove-lime text-grove-root'
                        : 'border-grove-moss bg-grove-canopy text-grove-cream hover:border-grove-fernLine'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-xs font-ui text-center">{label}</span>
                  </button>
                ))}
              </div>

              <textarea aria-label="Notes (optional)"
                value={careNotes}
                onChange={(e) => setCareNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full min-h-touch rounded-control border-hairline border-grove-moss bg-grove-canopy p-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-sprout resize-none h-20"
              />

              <button
                onClick={handleLogCare}
                disabled={!careAction || loggingCare}
                data-testid="bouquet-log-care-submit"
                className={cn(buttonVariants(), "w-full disabled:opacity-50 flex items-center justify-center gap-1.5")}
              >
                {loggingCare ? 'Logging…' : 'Log care'}
              </button>

              {/* Care log history */}
              {bouquet.care_logs?.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="font-plant text-grove-cream text-base font-semibold ">Care history</h3>
                  {bouquet.care_logs.map(log => (
                    <div key={log.id} className="rounded-card border-hairline border-grove-moss bg-grove-canopy px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="font-ui text-xs text-grove-cream capitalize">{log.action?.replace('_', ' ')}</p>
                        {log.notes && <p className="font-ui text-xs text-grove-sage">{log.notes}</p>}
                      </div>
                      <span className="font-ui text-xs text-grove-sage">{formatDate(log.logged_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
