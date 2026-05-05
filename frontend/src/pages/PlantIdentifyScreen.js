import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, RotateCcw, Sparkles, Edit3, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { plantAPI, getFileUrl } from '../lib/api';
import PlantImage from '../components/PlantImage';
import { impactLight, impactMedium, success } from '../lib/haptics';
import { useAuth } from '../contexts/AuthContext';

const FREQ_CHIPS = [3, 5, 7, 10, 14, 21];
const ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Balcony', 'Patio', 'Greenhouse', 'Hallway', 'Dining Room'];

export default function PlantIdentifyScreen({ onSwitchToManual }) {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      const up = await plantAPI.upload(fd);
      const path = up.data.path;
      setPhotoPath(path);
      // Animate progress dots while waiting on Claude
      setTimeout(() => setScanProgress(p => ({ ...p, species: true })), 600);
      setTimeout(() => setScanProgress(p => ({ ...p, health: true })), 1200);
      setTimeout(() => setScanProgress(p => ({ ...p, nickname: true })), 1800);
      const res = await plantAPI.identify({ path });
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
      toast.error('Photo upload failed');
      setStep('capture');
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
      navigate('/');
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
      <div className="max-w-[520px] mx-auto px-4 py-4" data-testid="identify-capture">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 font-plant uppercase tracking-[0.08em] text-[10px] text-[#1C2E10] hover:text-[#3B6D11]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <header className="mb-4">
          <h1 className="font-plant text-[#1C2E10] text-[17px]">Photograph your plant</h1>
          <p className="font-plant italic text-[#5F5E5A] text-xs mt-1">Grove will identify it for you.</p>
        </header>
        <PlantImage
          src={null}
          tone="plant"
          rounded="lg"
          className="w-full aspect-[4/3] mb-3"
          testId="identify-viewfinder"
        />
        <p className="font-ui text-xs text-[#5F5E5A] text-center mb-3">
          No need to know the name — just get the whole plant in frame.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <button
            type="button"
            onClick={(e) => { impactLight(e.currentTarget); cameraRef.current?.click(); }}
            data-testid="identify-take-photo"
            className="relative overflow-hidden rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#3B6D11] text-[#F5F0E8] border-[0.5px] border-[#3B6D11] hover:bg-[#2D5016] flex items-center justify-center gap-1.5"
          >
            <Camera className="h-4 w-4" /> Take photo
          </button>
          <button
            type="button"
            onClick={(e) => { impactLight(e.currentTarget); galleryRef.current?.click(); }}
            data-testid="identify-choose-existing"
            className="relative overflow-hidden rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#3B6D11] flex items-center justify-center gap-1.5"
          >
            <ImageIcon className="h-4 w-4" /> Choose existing
          </button>
        </div>
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onSwitchToManual}
            data-testid="identify-switch-manual"
            className="font-ui text-[12px] text-[#3B6D11] underline-offset-2 hover:underline"
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
      <div className="max-w-[520px] mx-auto px-4 py-4" data-testid="identify-scanning">
        <PlantImage src={photoPath} tone="plant" rounded="lg" className="w-full h-[170px] mb-3" />
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
            <p className="font-plant text-[#1C2E10] text-sm">Identifying your plant…</p>
          </div>
          <p className="font-ui text-[10px] uppercase tracking-[0.1em] text-[#888780] mb-2">Checking</p>
          <ul className="space-y-1.5">
            {items.map(({ key, label }) => (
              <li key={key} className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${scanProgress[key] ? 'bg-[#3B6D11] text-[#EAF3DE]' : 'bg-[#EDE5D8] text-[#D3C9B8]'}`}>
                  {scanProgress[key] ? <Check className="h-3 w-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#D3C9B8]" />}
                </span>
                <span className={`font-ui text-sm ${scanProgress[key] ? 'text-[#1C2E10]' : 'text-[#888780]'}`}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-4" data-testid="identify-failed">
        <PlantImage src={photoPath} tone="plant" rounded="lg" className="w-full h-[200px] mb-3" />
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4">
          <p className="font-plant text-[#1C2E10] text-sm mb-1">Identification unavailable</p>
          <p className="font-ui text-xs text-[#5F5E5A] leading-snug">
            Grove couldn't identify this plant right now. You can try again or enter the details yourself.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={reset} data-testid="identify-retry" className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#3B6D11] text-[#F5F0E8] hover:bg-[#2D5016] flex items-center justify-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Try again
            </button>
            <button onClick={onSwitchToManual} data-testid="identify-go-manual" className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#3B6D11]">
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

  return (
    <div className="max-w-[520px] mx-auto px-4 py-4 pb-24" data-testid={lowConf ? 'identify-low-conf' : 'identify-review'}>
      <PlantImage src={photoPath} tone="plant" rounded="lg" className="w-full h-[180px] mb-3" />
      <div className="mb-3">
        <p className="font-ui text-[10px] uppercase tracking-[0.1em] text-[#888780]">{lowConf ? 'We think this might be…' : 'Identified'}</p>
        <h1 className="font-plant text-[#1C2E10] text-lg leading-tight">{identified?.commonName || 'Plant'}</h1>
        {identified?.latinName && <p className="font-latin text-[11px] text-[#639922]">{identified.latinName}</p>}
        <p className={`font-latin text-[10px] mt-0.5 ${lowConf ? 'text-[#BA7517]' : 'text-[#888780]'}`}>Confidence: {confidencePct}%</p>
        {lowConf && identified?.message && (
          <p className="italic font-plant text-xs text-[#5F5E5A] mt-2">“{identified.message}”</p>
        )}
      </div>
      <div className="h-px bg-[#D3C9B8] my-3" />

      <FieldRow label="Species" testId="field-species" editing={editing.species} onEditToggle={() => toggleEdit('species')} display={form.common_name}>
        <input
          autoFocus
          value={form.common_name}
          onChange={(e) => setField('common_name', e.target.value)}
          className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-3 py-2 text-sm font-ui"
        />
      </FieldRow>

      <FieldRow label="Nickname" testId="field-nickname" editing={editing.nickname} onEditToggle={() => toggleEdit('nickname')} display={form.nickname || '—'}>
        <input
          autoFocus
          value={form.nickname}
          onChange={(e) => setField('nickname', e.target.value)}
          placeholder="Give your plant a name"
          className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-3 py-2 text-sm font-ui"
        />
      </FieldRow>

      <FieldRow label="Room" testId="field-room" editing={editing.room} onEditToggle={() => toggleEdit('room')} display={form.room || 'Pick a room'}>
        <div className="flex flex-wrap gap-1.5">
          {ROOMS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setField('room', r); toggleEdit('room'); }}
              className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui ${form.room === r ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]' : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17]'}`}
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
              className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui ${form.watering_frequency_days === d ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]' : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17]'}`}
            >{d}d</button>
          ))}
        </div>
      </FieldRow>

      {/* Health */}
      <div className="mt-2 mb-3">
        <p className="font-ui text-[10px] uppercase tracking-[0.1em] text-[#888780]">Health · initial reading</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-[#EDE5D8] rounded-full overflow-hidden">
            <div className="h-full bg-[#3B6D11]" style={{ width: `${identified?.healthScore || 80}%` }} />
          </div>
          <span className="font-plant text-[#1C2E10] text-sm">{identified?.healthScore || 80}</span>
        </div>
        {identified?.healthSummary && (
          <p className="italic font-plant text-xs text-[#5F5E5A] mt-1.5 leading-snug">“{identified.healthSummary}”</p>
        )}
        <p className="font-plant italic text-[11px] text-[#888780] mt-1">
          Based on your photo today. This score improves as Grove learns your plant's real patterns over time.
        </p>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={reset}
          data-testid="identify-rescan"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#3B6D11] flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Looks wrong? Re-scan
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.common_name}
          data-testid="identify-add-plant"
          className="relative overflow-hidden rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#1C2E10] text-[#F5F0E8] border-[0.5px] border-[#1C2E10] hover:bg-[#2D5016] disabled:opacity-50 flex items-center justify-center gap-1.5"
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
      <p className="font-ui text-[10px] uppercase tracking-[0.1em] text-[#888780] mb-1">{label}</p>
      {editing ? (
        <div className="space-y-2">
          {children}
          <button
            type="button"
            onClick={onEditToggle}
            className="font-plant uppercase tracking-[0.08em] text-[10px] text-[#3B6D11] hover:text-[#2D5016] inline-flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onEditToggle}
          data-testid={`${testId}-edit`}
          className="w-full text-left rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-3 py-2 hover:border-[#3B6D11] flex items-center justify-between"
        >
          <span className="font-ui text-sm text-[#1C2E10] truncate">{display}</span>
          <Edit3 className="h-3.5 w-3.5 text-[#3B6D11] flex-shrink-0" />
        </button>
      )}
    </div>
  );
}
