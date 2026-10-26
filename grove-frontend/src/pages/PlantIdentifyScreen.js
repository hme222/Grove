import React, { useRef, useState } from 'react';
import { Spinner } from '../components/Loading';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import BackButton from '../components/BackButton';
import { Camera, Image as ImageIcon, RotateCcw, Sparkles, Edit3, Check } from 'lucide-react';
import { toast } from 'sonner';
import { plantAPI } from '../lib/api';
import PlantImage from '../components/PlantImage';
import ToxicityBadge from '../components/ToxicityBadge';
import { confidenceText, identifyWhy } from '../lib/aiTrust';
import { impactLight, impactMedium, success } from '../lib/haptics';

const FREQ_CHIPS = [3, 5, 7, 10, 14, 21];
const ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Balcony', 'Patio', 'Greenhouse', 'Hallway', 'Dining Room'];

// Focus a field the moment the user opens it for editing.
const focusOnMount = (el) => { if (el) el.focus(); };

export default function PlantIdentifyScreen({ onSwitchToManual }) {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  // step: 'capture' | 'scanning' | 'review' | 'low_confidence' | 'failed'
  const [step, setStep] = useState('capture');
  const [photoPath, setPhotoPath] = useState(null);
  const [scanProgress, setScanProgress] = useState({ species: false, health: false, nickname: false });
  const [identified, setIdentified] = useState(null);
  const [editing, setEditing] = useState({}); // {field: bool}
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setStep('scanning');
    setScanProgress({ species: false, health: false, nickname: false });
    try {
      const fd = new FormData();
      fd.append('file', file);
      let path;
      try {
        const up = await plantAPI.upload(fd);
        path = up.data.path;
      } catch (uploadErr) {
        toast.error("The photo didn't upload. Check your connection and choose it again.");
        setStep('capture');
        return;
      }
      setPhotoPath(path);
      // Animate progress dots while waiting on Claude
      setTimeout(() => setScanProgress(p => ({ ...p, species: true })), 600);
      setTimeout(() => setScanProgress(p => ({ ...p, health: true })), 1200);
      setTimeout(() => setScanProgress(p => ({ ...p, nickname: true })), 1800);
      let res;
      try {
        res = await plantAPI.identify({ path });
      } catch (identifyErr) {
        // The photo is safe on the server; keep it and offer retry or manual entry.
        setStep('failed');
        return;
      }
      const data = res.data;
      if (!data || data.error) {
        setStep('failed');
        return;
      }
      setIdentified(data);
      setForm({
        common_name: data.commonName || '',
        latin_name: data.latinName || '',
        // Phase 14 Part 4.5 — never AI-auto-generate cute nicknames
        nickname: '',
        room: '',
        watering_frequency_days: data.wateringFrequencyDays || 7,
        grow_medium: data.growMedium && data.growMedium !== 'unknown' ? data.growMedium : 'soil',
      });
      if (!data.identified || (data.confidence || 0) < 0.7) {
        setStep('low_confidence');
        success();
      } else {
        setStep('review');
        success();
      }
    } catch (e) {
      setStep('failed');
    }
  };

  const retryIdentify = async () => {
    if (!photoPath) { setStep('capture'); return; }
    setStep('scanning');
    try {
      const res = await plantAPI.identify({ path: photoPath });
      const data = res.data;
      if (!data || data.error) { setStep('failed'); return; }
      setIdentified(data);
      setForm({
        common_name: data.commonName || '',
        latin_name: data.latinName || '',
        nickname: '',
        room: '',
        watering_frequency_days: data.wateringFrequencyDays || 7,
        grow_medium: data.growMedium && data.growMedium !== 'unknown' ? data.growMedium : 'soil',
      });
      setStep(!data.identified || (data.confidence || 0) < 0.7 ? 'low_confidence' : 'review');
    } catch (e) {
      setStep('failed');
    }
  };

  const reset = () => {
    setStep('capture');
    setPhotoPath(null);
    setIdentified(null);
    setEditing({});
    setForm({});
  };

  const handleSave = async (e) => {
    if (!photoPath) return;
    setSaving(true);
    impactMedium(e?.currentTarget);
    try {
      await plantAPI.create({
        common_name: form.common_name,
        latin_name: form.latin_name || null,
        nickname: form.nickname || null,
        room: form.room || null,
        grow_medium: form.grow_medium || 'soil',
        watering_frequency_days: form.watering_frequency_days || null,
        photo_url: photoPath,
        ai_identified: true,
        ai_confidence: identified?.confidence || null,
        ai_health_score: identified?.healthScore || null,
        ai_health_summary: identified?.healthSummary || '',
        ai_health_flags: identified?.healthFlags || [],
      });
      toast.success(`${form.nickname || form.common_name} joined your grove`);
      navigate('/plants');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add plant');
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = (field) => setEditing(e => ({ ...e, [field]: !e[field] }));
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (step === 'capture') {
    return (
      <div className="max-w-form mx-auto px-4 py-4" data-testid="identify-capture">
        <BackButton />
        <header className="mb-4">
          <h1 className="font-plant text-grove-cream text-lead">Photograph your plant</h1>
          <p className="font-ui italic text-grove-sage text-xs font-medium mt-1">FloraGrove will identify it for you.</p>
        </header>
        <PlantImage
          src={null}
          tone="plant"
          rounded="lg"
          className="w-full aspect-[4/3] mb-3"
          testId="identify-viewfinder"
        />
        <p className="font-ui text-xs text-grove-sage text-center mb-3">
          No need to know the name — just get the whole plant in frame.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <button
            type="button"
            onClick={(e) => { impactLight(e.currentTarget); cameraRef.current?.click(); }}
            data-testid="identify-take-photo"
            className={cn(buttonVariants(), "relative overflow-hidden flex gap-1.5")}
          >
            <Camera className="h-4 w-4" /> Take photo
          </button>
          <button
            type="button"
            onClick={(e) => { impactLight(e.currentTarget); galleryRef.current?.click(); }}
            data-testid="identify-choose-existing"
            className="relative overflow-hidden rounded-control font-ui text-xs px-4 py-3 bg-transparent text-grove-cream border-hairline border-grove-moss hover:border-grove-fernLine flex items-center justify-center gap-1.5"
          >
            <ImageIcon className="h-4 w-4" /> Choose existing
          </button>
        </div>
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onSwitchToManual}
            data-testid="identify-switch-manual"
            className="font-ui text-xs text-grove-sprout underline-offset-2 hover:underline"
          >
            I know my plant — enter details →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'scanning') {
    const items = [
      { key: 'species', label: 'Species' },
      { key: 'health', label: 'Health' },
      { key: 'nickname', label: 'Nickname suggestion' },
    ];
    return (
      <div className="max-w-form mx-auto px-4 py-4" data-testid="identify-scanning">
        <PlantImage src={photoPath} tone="plant" rounded="lg" className="w-full h-photoFrame mb-3" />
        <div className="rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-4">
          <div className="flex items-center gap-2 mb-3" role="status">
            <Spinner />
            <p className="font-ui text-grove-cream text-sm font-medium">Identifying your plant…</p>
          </div>
          <p className="font-ui text-xs text-grove-lichen mb-2">Checking</p>
          <ul className="space-y-1.5">
            {items.map(({ key, label }) => (
              <li key={key} className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${scanProgress[key] ? 'bg-grove-lime text-grove-root' : 'bg-grove-moss text-grove-sage'}`}>
                  {scanProgress[key] ? <Check className="h-3 w-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-grove-moss" />}
                </span>
                <span className={`font-ui text-sm ${scanProgress[key] ? 'text-grove-cream' : 'text-grove-lichen'}`}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="max-w-form mx-auto px-4 py-4" data-testid="identify-failed">
        <PlantImage src={photoPath} tone="plant" rounded="lg" className="w-full h-photoFrame mb-3" />
        <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
          <p className="font-ui text-grove-cream text-sm font-medium mb-1">Identification unavailable</p>
          <p className="font-ui text-xs text-grove-sage leading-snug">
            The photo is saved. The identify service didn't answer, so this isn't a problem with your photo. Try again, or enter the details yourself.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={retryIdentify} data-testid="identify-retry" className={cn(buttonVariants(), "flex items-center justify-center gap-1.5")}>
              <RotateCcw className="h-3.5 w-3.5" /> Try again
            </button>
            <button onClick={onSwitchToManual} data-testid="identify-go-manual" className={cn(buttonVariants({ variant: 'outline' }))}>
              Enter manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Both review and low_confidence share the editable form, with header variant.
  const lowConf = step === 'low_confidence';
  const confidencePct = Math.round((identified?.confidence || 0) * 100);
  const speciesEdited = (form.common_name || '') !== (identified?.commonName || '');

  return (
    <div className="max-w-form mx-auto px-4 py-4 pb-24" data-testid={lowConf ? 'identify-low-conf' : 'identify-review'}>
      <PlantImage src={photoPath} tone="plant" rounded="lg" className="w-full h-photoFrame mb-3" />
      <div className="mb-3">
        <p className="font-ui text-xs text-grove-lichen">{lowConf ? 'We think this might be…' : 'Identified'}</p>
        <h1 className="font-plant text-grove-cream text-lg leading-tight">{identified?.commonName || 'Plant'}</h1>
        {identified?.latinName && <p className="font-latin text-xs text-grove-sprout">{identified.latinName}</p>}
        <p
          data-testid="identify-confidence"
          className={`font-ui text-xs mt-1 ${lowConf ? 'text-grove-sun' : 'text-grove-sage'}`}
        >
          {confidenceText(identified?.confidence) || `Confidence: ${confidencePct}%`}
        </p>
        <p data-testid="identify-why" className="font-ui text-xs text-grove-cream mt-1 leading-snug">
          <span className="font-semibold">Why: </span>
          {identifyWhy(identified)}
        </p>
        {lowConf && identified?.message && (
          <p className="italic font-ui text-xs font-medium text-grove-sage mt-2">"{identified.message}"</p>
        )}
        {/* Pet safety is from FloraGrove's species library. If the user renames the
            species, the library match no longer applies, so it reads as unknown. */}
        <ToxicityBadge
          toxicity={speciesEdited ? null : identified?.toxicity}
          className="mt-2"
          testId="identify-toxicity"
        />
      </div>
      <div className="h-px bg-grove-moss my-3" />

      <FieldRow label="Species" testId="field-species" editing={editing.species} onEditToggle={() => toggleEdit('species')} display={form.common_name}>
        <input aria-label="Species"
          ref={focusOnMount}
          value={form.common_name}
          onChange={(e) => setField('common_name', e.target.value)}
          className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-3 py-2 text-sm font-ui"
        />
      </FieldRow>

      <FieldRow label="Nickname" testId="field-nickname" editing={editing.nickname} onEditToggle={() => toggleEdit('nickname')} display={form.nickname || '—'}>
        <input aria-label="Nickname"
          ref={focusOnMount}
          value={form.nickname}
          onChange={(e) => setField('nickname', e.target.value)}
          placeholder="Give your plant a name"
          className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-3 py-2 text-sm font-ui"
        />
      </FieldRow>

      <FieldRow label="Room" testId="field-room" editing={editing.room} onEditToggle={() => toggleEdit('room')} display={form.room || 'Pick a room'}>
        <div className="flex flex-wrap gap-1.5">
          {ROOMS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setField('room', r); toggleEdit('room'); }}
              className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={form.room === r}
            >{r}</button>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Watering schedule" testId="field-watering" editing={editing.watering} onEditToggle={() => toggleEdit('watering')} display={`Every ${form.watering_frequency_days || 7} days`}>
        <div className="flex flex-wrap gap-1.5">
          {FREQ_CHIPS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => { setField('watering_frequency_days', d); toggleEdit('watering'); }}
              className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={form.watering_frequency_days === d}
            >{d}d</button>
          ))}
        </div>
      </FieldRow>

      {/* Health */}
      <div className="mt-2 mb-3">
        <p className="font-ui text-xs text-grove-lichen">Health · initial reading</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-grove-moss rounded-full overflow-hidden">
            <div className="h-full bg-grove-lime" style={{ width: `${identified?.healthScore || 80}%` }} />
          </div>
          <span className="font-ui text-grove-cream text-sm font-medium">{identified?.healthScore || 80}</span>
        </div>
        {identified?.healthSummary && (
          <p className="italic font-ui text-xs font-medium text-grove-sage mt-1.5 leading-snug">"{identified.healthSummary}"</p>
        )}
        <p className="font-ui italic text-xs font-medium text-grove-lichen mt-1">
          Based on your photo today. This score improves as FloraGrove learns your plant's real patterns over time.
        </p>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={reset}
          data-testid="identify-rescan"
          className={cn(buttonVariants({ variant: 'outline' }), "flex gap-1.5")}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Looks wrong? Re-scan
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.common_name}
          data-testid="identify-add-plant"
          className={cn(buttonVariants(), "relative overflow-hidden disabled:opacity-50 flex items-center justify-center gap-1.5")}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {saving ? 'Adding…' : 'Add to grove'}
        </button>
      </div>
    </div>
  );
}

function FieldRow({ label, display, children, editing, onEditToggle, testId }) {
  return (
    <div className="py-2" data-testid={testId}>
      <p className="font-ui text-xs text-grove-lichen mb-1">{label}</p>
      {editing ? (
        <div className="space-y-2">
          {children}
          <button
            type="button"
            onClick={onEditToggle}
            className="font-ui text-xs font-medium text-grove-sprout hover:text-grove-sprout inline-flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onEditToggle}
          data-testid={`${testId}-edit`}
          className="w-full text-left rounded-inset border-hairline border-grove-moss bg-grove-canopy px-3 py-2 hover:border-grove-fernLine flex items-center justify-between"
        >
          <span className="font-ui text-sm text-grove-cream truncate">{display}</span>
          <Edit3 className="h-3.5 w-3.5 text-grove-sprout flex-shrink-0" />
        </button>
      )}
    </div>
  );
}
