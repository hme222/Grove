import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bouquetAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Edit2, Flower2, Droplets, Scissors, Camera, FileText, Share2 } from 'lucide-react';

const BOUQUET_CARE_ACTIONS = [
  { value: 'water_change', label: 'Water Change', icon: Droplets },
  { value: 'stem_recut', label: 'Recut Stems', icon: Scissors },
  { value: 'remove_flower', label: 'Remove Flower', icon: Flower2 },
  { value: 'photo', label: 'Photo', icon: Camera },
  { value: 'note', label: 'Note', icon: FileText },
];

export default function BouquetDetailPage() {
  const { bouquetId } = useParams();
  const navigate = useNavigate();
  const [bouquet, setBouquet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [identifying, setIdentifying] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [carePlan, setCarePlan] = useState(null);
  const [careAction, setCareAction] = useState(null);
  const [careNotes, setCareNotes] = useState('');
  const [loggingCare, setLoggingCare] = useState(false);

  const fetchBouquet = useCallback(async () => {
    try {
      const res = await bouquetAPI.getOne(bouquetId);
      setBouquet(res.data);
      if (res.data.care_plan) setCarePlan(res.data.care_plan);
    } catch (e) {
      toast.error('Failed to load bouquet');
      navigate('/bouquets');
    } finally {
      setLoading(false);
    }
  }, [bouquetId, navigate]);

  useEffect(() => { fetchBouquet(); }, [fetchBouquet]);

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
      navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading || !bouquet) {
    return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#D4537E] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const photoUrl = getFileUrl(bouquet.photo_url);
  const daysAlive = bouquet.received_date
    ? Math.max(0, Math.ceil((Date.now() - new Date(bouquet.received_date).getTime()) / 86400000))
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="relative">
        <div className="aspect-[16/9] bg-[#FBEAF0] overflow-hidden relative">
          {photoUrl ? (
            <div className="w-full h-full bg-[#FDF5F8] flex items-center justify-center"><img src={photoUrl} alt={bouquet.name} className="max-w-full max-h-full w-auto h-auto object-contain" /></div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Flower2 className="h-16 w-16 text-[#D4537E] opacity-20" />
            </div>
          )}
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[#1C2E10]/70 flex items-center justify-center text-[#F5F0E8]">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="absolute top-4 right-4 flex gap-2">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <div className="w-9 h-9 rounded-full bg-[#D4537E]/80 flex items-center justify-center text-white hover:bg-[#D4537E]">
                <Edit2 className="h-4 w-4" />
              </div>
            </label>
            <button onClick={handleShare} className="w-9 h-9 rounded-full bg-[#D4537E]/80 flex items-center justify-center text-white hover:bg-[#D4537E]">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-[#FBEAF0] border-b-[0.5px] border-[#D4537E]/20 px-4 py-3">
          <div className="max-w-[1100px] mx-auto flex items-start justify-between">
            <div>
              <h1 className="font-plant text-[#1C2E10] text-2xl">{bouquet.name || 'Bouquet'}</h1>
              <div className="flex items-center gap-2 mt-1">
                {bouquet.occasion && (
                  <span className="rounded-[20px] border-[0.5px] border-[#D4537E]/30 bg-white px-2.5 py-0.5 text-[10px] font-ui text-[#D4537E] capitalize">{bouquet.occasion}</span>
                )}
                <span className="font-latin text-[10px] text-[#D4537E]">{formatDate(bouquet.received_date)}</span>
              </div>
            </div>
            <div className="text-right">
              {bouquet.vase_life_expected && (
                <div className="rounded-[20px] border-[0.5px] border-[#D4537E] bg-[#D4537E] px-3 py-1 text-white text-xs font-ui">
                  Day {daysAlive} / {bouquet.vase_life_expected}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto px-4 py-4">
        <Tabs defaultValue="flowers">
          <TabsList className="bg-transparent border-b-[0.5px] border-[#D4537E]/20 rounded-none w-full justify-start gap-1 h-auto p-0">
            <TabsTrigger value="flowers" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#FBEAF0] data-[state=active]:text-[#D4537E] text-xs font-ui px-4 py-2">Flowers</TabsTrigger>
            <TabsTrigger value="care" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#FBEAF0] data-[state=active]:text-[#D4537E] text-xs font-ui px-4 py-2">Care Plan</TabsTrigger>
            <TabsTrigger value="log" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#FBEAF0] data-[state=active]:text-[#D4537E] text-xs font-ui px-4 py-2">Log Care</TabsTrigger>
          </TabsList>

          {/* Flowers Tab */}
          <TabsContent value="flowers" className="pt-4">
            {(!bouquet.flowers || bouquet.flowers.length === 0) ? (
              <div className="rounded-[14px] border-[0.5px] border-[#D4537E]/30 bg-[#FBEAF0] p-5 text-center">
                <Flower2 className="h-8 w-8 text-[#D4537E] opacity-30 mx-auto mb-2" />
                <p className="font-plant text-[#1C2E10] text-sm">No flowers identified yet</p>
                <p className="font-ui text-xs text-[#D4537E] mt-1 mb-3">
                  {bouquet.photo_url ? 'AI will analyze your bouquet photo' : 'Upload a photo or use text-based identification'}
                </p>
                <button
                  onClick={handleIdentify}
                  disabled={identifying}
                  data-testid="identify-flowers-button"
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2.5 border-[0.5px] bg-[#D4537E] text-white border-[#D4537E] hover:bg-[#b8446a] disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {identifying ? 'Identifying...' : 'Identify Flowers'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-plant text-[#1C2E10] text-sm">{bouquet.flowers.length} flowers identified</h3>
                  <button onClick={handleIdentify} disabled={identifying} className="text-xs font-ui text-[#D4537E] hover:text-[#b8446a] disabled:opacity-50">
                    {identifying ? 'Re-identifying...' : 'Re-identify'}
                  </button>
                </div>
                {bouquet.flowers.map((f, i) => (
                  <div key={f.id || i} className="rounded-[14px] border-[0.5px] border-[#D4537E]/20 bg-[#FBEAF0] p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-plant text-[#1C2E10] text-sm">{f.common_name}</p>
                        <p className="font-latin text-[10px] text-[#D4537E]">{f.latin_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-[20px] border-[0.5px] border-[#D4537E]/30 bg-white px-2 py-0.5 text-[9px] font-ui text-[#D4537E]">
                          {f.vase_life_days}d life
                        </span>
                        <p className="font-latin text-[9px] text-[#D3C9B8] mt-1">
                          {Math.round((f.ai_confidence || 0) * 100)}% confident
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-ui text-[#2B2B26]">x{f.stem_count || 1} stems</span>
                    </div>
                    {f.care_instructions && (
                      <p className="font-ui text-xs text-[#2B2B26] mt-2">{f.care_instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Care Plan Tab */}
          <TabsContent value="care" className="pt-4">
            {!carePlan ? (
              <div className="rounded-[14px] border-[0.5px] border-[#D4537E]/30 bg-[#FBEAF0] p-5 text-center">
                <p className="font-plant text-[#1C2E10] text-sm">No care plan yet</p>
                <p className="font-ui text-xs text-[#D4537E] mt-1 mb-3">Generate a personalized care plan based on identified flowers.</p>
                <button
                  onClick={handleCarePlan}
                  disabled={generatingPlan || (!bouquet.flowers || bouquet.flowers.length === 0)}
                  data-testid="generate-care-plan-button"
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2.5 border-[0.5px] bg-[#D4537E] text-white border-[#D4537E] hover:bg-[#b8446a] disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingPlan ? 'Generating...' : 'Generate Care Plan'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {carePlan.vase_life_days && (
                  <div className="rounded-[14px] border-[0.5px] border-[#D4537E] bg-[#D4537E] p-3 text-center">
                    <p className="font-plant text-white text-lg">{carePlan.vase_life_days} days expected vase life</p>
                  </div>
                )}
                {carePlan.immediate_steps?.length > 0 && (
                  <div className="rounded-[14px] border-[0.5px] border-[#D4537E]/20 bg-[#FBEAF0] p-4">
                    <h3 className="font-plant text-[#1C2E10] text-sm mb-2">Do Now</h3>
                    <ul className="space-y-1.5">
                      {carePlan.immediate_steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-ui text-[#1A1A17]">
                          <span className="text-[#D4537E] mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {carePlan.daily_steps?.length > 0 && (
                  <div className="rounded-[14px] border-[0.5px] border-[#D4537E]/20 bg-[#FBEAF0] p-4">
                    <h3 className="font-plant text-[#1C2E10] text-sm mb-2">Daily Care</h3>
                    <ul className="space-y-1.5">
                      {carePlan.daily_steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-ui text-[#1A1A17]">
                          <span className="text-[#D4537E] mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {carePlan.day_specific?.length > 0 && (
                  <div className="rounded-[14px] border-[0.5px] border-[#D4537E]/20 bg-[#FBEAF0] p-4">
                    <h3 className="font-plant text-[#1C2E10] text-sm mb-2">Day-by-Day</h3>
                    <div className="space-y-1.5">
                      {carePlan.day_specific.map((d, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="font-latin text-[10px] text-[#D4537E] font-bold w-8 flex-shrink-0">Day {d.day}</span>
                          <span className="text-xs font-ui text-[#1A1A17]">{d.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {carePlan.preserve_note && (
                  <div className="rounded-[14px] border-[0.5px] border-[#D4537E]/20 bg-[#FBEAF0] p-4">
                    <h3 className="font-plant text-[#1C2E10] text-sm mb-1">Preservation</h3>
                    <p className="font-ui text-xs text-[#1A1A17]">{carePlan.preserve_note}</p>
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
                    data-testid={`bouquet-care-${value}`}
                    className={`flex flex-col items-center gap-1 p-3 rounded-[8px] border-[0.5px] transition-colors duration-150 ${
                      careAction === value
                        ? 'border-[#D4537E] bg-[#FBEAF0]'
                        : 'border-[#D3C9B8] bg-[#EDE5D8] hover:border-[#D4537E]'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-[#D4537E]" />
                    <span className="text-[9px] font-ui text-[#1A1A17] text-center">{label}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={careNotes}
                onChange={(e) => setCareNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full bg-[#FBEAF0] border-[0.5px] border-[#D4537E]/30 rounded-[8px] p-3 text-sm font-ui placeholder:text-[#D4537E]/40 focus:outline-none focus:ring-2 focus:ring-[#D4537E] resize-none h-20"
              />

              <button
                onClick={handleLogCare}
                disabled={!careAction || loggingCare}
                data-testid="bouquet-log-care-submit"
                className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#D4537E] text-white border-[#D4537E] hover:bg-[#b8446a] disabled:opacity-50"
              >
                {loggingCare ? 'Logging...' : 'Log Care'}
              </button>

              {/* Care log history */}
              {bouquet.care_logs?.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="font-plant text-[#1C2E10] text-sm">Care History</h3>
                  {bouquet.care_logs.map(log => (
                    <div key={log.id} className="rounded-[8px] border-[0.5px] border-[#D4537E]/20 bg-[#FBEAF0] px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="font-ui text-xs text-[#1A1A17] capitalize">{log.action?.replace('_', ' ')}</p>
                        {log.notes && <p className="font-ui text-[10px] text-[#D4537E]">{log.notes}</p>}
                      </div>
                      <span className="font-latin text-[9px] text-[#D3C9B8]">{formatDate(log.logged_at)}</span>
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
