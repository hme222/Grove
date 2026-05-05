import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, RotateCcw, Sparkles, ArrowLeft, X, Check, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { plantAPI } from '../lib/api';
import PlantImage from '../components/PlantImage';
import { impactLight, impactMedium, success } from '../lib/haptics';

const FREQ_CHIPS = [3, 5, 7, 10, 14, 21];
const ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Balcony', 'Patio', 'Greenhouse', 'Hallway', 'Dining Room'];

// Crop a single plant from the room photo using Canvas
async function cropPlant(roomDataUrl, box, padding = 0.05) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const px = Math.max(0, (box.xPercent / 100 - padding) * img.width);
        const py = Math.max(0, (box.yPercent / 100 - padding) * img.height);
        const pw = Math.min(img.width - px, (box.widthPercent / 100 + padding * 2) * img.width);
        const ph = Math.min(img.height - py, (box.heightPercent / 100 + padding * 2) * img.height);
        canvas.width = Math.max(64, pw);
        canvas.height = Math.max(64, ph);
        ctx.drawImage(img, px, py, pw, ph, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => {
          if (!b) return reject(new Error('crop_failed'));
          resolve(b);
        }, 'image/jpeg', 0.9);
      } catch (e) { reject(e); }
    };
    img.onerror = reject;
    img.src = roomDataUrl;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function RoomScanScreen() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  // step: 'capture' | 'scanning' | 'review' | 'creating' | 'success' | 'failed'
  const [step, setStep] = useState('capture');
  const [roomDataUrl, setRoomDataUrl] = useState(null);
  const [scanResult, setScanResult] = useState(null); // {plantsFound, plants, roomDescription}
  const [crops, setCrops] = useState({}); // id -> objectUrl
  const [selected, setSelected] = useState({}); // id -> bool
  const [edits, setEdits] = useState({}); // id -> {nickname?, watering_frequency_days?, grow_medium?}
  const [room, setRoom] = useState('');
  const [progress, setProgress] = useState({ a: false, b: false, c: false, d: false });
  const [created, setCreated] = useState([]);

  const handleFile = async (file) => {
    if (!file) return;
    setStep('scanning');
    setProgress({ a: false, b: false, c: false, d: false });
    try {
      const dataUrl = await fileToDataUrl(file);
      setRoomDataUrl(dataUrl);
      // Upload original room photo too — not strictly needed but helps debugging.
      const fd = new FormData();
      fd.append('file', file);
      // We use it via base64 instead of path so the room photo doesn't pollute storage.
      const b64 = dataUrl.split(',')[1];
      // Animate progress dots
      setTimeout(() => setProgress(p => ({ ...p, a: true })), 600);
      setTimeout(() => setProgress(p => ({ ...p, b: true })), 1500);
      setTimeout(() => setProgress(p => ({ ...p, c: true })), 2400);
      setTimeout(() => setProgress(p => ({ ...p, d: true })), 3300);
      const res = await plantAPI.scanRoom({ image_base64: b64 });
      const data = res.data;
      if (!data || data.error) {
        setStep('failed');
        return;
      }
      setScanResult(data);
      // Pre-crop each plant on the client and pre-select with confidence-based default.
      const cmap = {};
      const sel = {};
      const ed = {};
      for (const p of (data.plants || [])) {
        try {
          const blob = await cropPlant(dataUrl, p.boundingBox, 0.05);
          cmap[p.id] = URL.createObjectURL(blob);
        } catch (_e) { /* skip cropping */ }
        sel[p.id] = (p.confidence || 0) >= 0.65;
        ed[p.id] = {
          nickname: p.nicknameSuggestion || '',
          watering_frequency_days: p.wateringFrequencyDays || 7,
          grow_medium: p.growMedium && p.growMedium !== 'unknown' ? p.growMedium : 'soil',
        };
      }
      setCrops(cmap);
      setSelected(sel);
      setEdits(ed);
      setStep('review');
      success();
    } catch (e) {
      toast.error('Room scan failed');
      setStep('failed');
    }
  };

  // Cleanup blob URLs on unmount
  useEffect(() => () => {
    Object.values(crops).forEach(u => URL.revokeObjectURL(u));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelected = (id) => {
    impactLight();
    setSelected(s => ({ ...s, [id]: !s[id] }));
  };

  const allSelected = Object.values(selected).every(Boolean) && Object.keys(selected).length > 0;
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const toggleAll = () => {
    const next = !allSelected;
    const newSel = {};
    for (const id of Object.keys(selected)) newSel[id] = next;
    setSelected(newSel);
  };

  const handleAddBatch = async () => {
    if (!scanResult || selectedCount === 0) return;
    setStep('creating');
    try {
      const items = [];
      for (const p of scanResult.plants) {
        if (!selected[p.id]) continue;
        // Upload the cropped blob via FormData
        const blobUrl = crops[p.id];
        if (!blobUrl) continue;
        const blob = await fetch(blobUrl).then(r => r.blob());
        const fd = new FormData();
        fd.append('file', new File([blob], `${p.id}.jpg`, { type: 'image/jpeg' }));
        const up = await plantAPI.upload(fd);
        const path = up.data.path;
        const e = edits[p.id] || {};
        items.push({
          common_name: p.commonName,
          latin_name: p.latinName || null,
          nickname: e.nickname || null,
          grow_medium: e.grow_medium || 'soil',
          watering_frequency_days: e.watering_frequency_days || p.wateringFrequencyDays || 7,
          photo_url: path,
          ai_identified: true,
          ai_confidence: p.confidence || null,
          ai_health_score: p.healthScore || null,
          ai_health_summary: p.healthSummary || '',
        });
      }
      const res = await plantAPI.batchCreate({ plants: items, room: room || (scanResult.roomDescription || '') });
      setCreated(res.data.plants || []);
      setStep('success');
      success();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add plants');
      setStep('review');
    }
  };

  if (step === 'capture') {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-4" data-testid="room-scan-capture">
        <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 font-plant uppercase tracking-[0.08em] text-[10px] text-[#1C2E10] hover:text-[#3B6D11]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h1 className="font-plant text-[#1C2E10] text-[17px]">Scan a room</h1>
        <p className="font-plant italic text-[#5F5E5A] text-xs mt-1 mb-4">Photograph a shelf or whole room. Grove finds every plant.</p>
        <PlantImage tone="plant" rounded="lg" className="w-full aspect-[4/3] mb-3" testId="room-viewfinder" />
        <p className="font-ui text-xs text-[#5F5E5A] text-center mb-3">Frame the whole space — windowsill, shelf, or corner. Steady the camera.</p>
        <div className="grid grid-cols-2 gap-2">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <button onClick={(e) => { impactLight(e.currentTarget); cameraRef.current?.click(); }} data-testid="room-take-photo" className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#3B6D11] text-[#F5F0E8] hover:bg-[#2D5016] flex items-center justify-center gap-1.5">
            <Camera className="h-4 w-4" /> Take photo
          </button>
          <button onClick={(e) => { impactLight(e.currentTarget); galleryRef.current?.click(); }} data-testid="room-choose-existing" className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#3B6D11] flex items-center justify-center gap-1.5">
            <ImageIcon className="h-4 w-4" /> Choose existing
          </button>
        </div>
      </div>
    );
  }

  if (step === 'scanning') {
    const items = [
      { key: 'a', label: 'Looking for plants in the frame' },
      { key: 'b', label: 'Identifying each species' },
      { key: 'c', label: 'Checking their health' },
      { key: 'd', label: 'Suggesting nicknames' },
    ];
    return (
      <div className="max-w-[520px] mx-auto px-4 py-4" data-testid="room-scan-scanning">
        <PlantImage src={roomDataUrl} tone="plant" rounded="lg" className="w-full h-[200px] mb-3" />
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-4 py-4">
          <p className="font-plant text-[#1C2E10] text-sm mb-3">Scanning your room…</p>
          <ul className="space-y-1.5">
            {items.map(({ key, label }) => (
              <li key={key} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${progress[key] ? 'bg-[#3B6D11]' : 'bg-[#D3C9B8]'}`} />
                <span className={`font-ui text-sm ${progress[key] ? 'text-[#1C2E10]' : 'text-[#888780]'}`}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-4" data-testid="room-scan-failed">
        <PlantImage src={roomDataUrl} tone="plant" rounded="lg" className="w-full h-[180px] mb-3" />
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4">
          <p className="font-plant text-[#1C2E10] text-sm mb-1">Scan unavailable</p>
          <p className="font-ui text-xs text-[#5F5E5A] leading-snug">
            We couldn't analyze that room photo. Try another shot, or photograph plants individually.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => setStep('capture')} className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#3B6D11] text-[#F5F0E8] hover:bg-[#2D5016] flex items-center justify-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Try again
            </button>
            <button onClick={() => navigate('/add-plant')} className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-transparent text-[#1C2E10] border-[0.5px] border-[#D3C9B8] hover:border-[#3B6D11]">
              Try one plant
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'creating') {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-12 text-center" data-testid="room-scan-creating">
        <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-plant text-[#1C2E10] text-sm">Adding {selectedCount} plants to your grove…</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-[520px] mx-auto px-4 py-8 text-center" data-testid="room-scan-success">
        <div className="relative inline-block mb-4">
          <div className="w-16 h-16 rounded-full bg-[#1C2E10] text-[#9FE1CB] flex items-center justify-center mx-auto">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>
        <h1 className="font-plant text-[#1C2E10] text-xl mb-1">{created.length} plants joined your grove.</h1>
        <div className="flex flex-wrap gap-2 justify-center my-4">
          {created.map(p => (
            <span key={p.id} className="rounded-[16px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-3 py-1 text-xs font-ui text-[#1C2E10]">
              {p.nickname ? `${p.nickname} · ${p.common_name}` : p.common_name}
            </span>
          ))}
        </div>
        <p className="italic font-plant text-xs text-[#5F5E5A] mb-5">Their stories are just beginning.</p>
        <button onClick={() => navigate('/')} data-testid="room-scan-success-cta" className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-5 py-3 bg-[#1C2E10] text-[#F5F0E8] hover:bg-[#2D5016]">
          See your collection →
        </button>
      </div>
    );
  }

  // Review step
  return (
    <div className="max-w-[520px] mx-auto px-4 py-4 pb-32" data-testid="room-scan-review">
      <button onClick={() => setStep('capture')} className="mb-3 inline-flex items-center gap-1 font-plant uppercase tracking-[0.08em] text-[10px] text-[#1C2E10] hover:text-[#3B6D11]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h1 className="font-plant text-[#1C2E10] text-[17px]">Grove found {scanResult?.plantsFound || 0} plants.</h1>
          <p className="font-plant italic text-[#5F5E5A] text-xs">Select which ones to add.</p>
        </div>
        {Object.keys(selected).length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            data-testid="room-scan-toggle-all"
            className="flex-shrink-0 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] hover:border-[#3B6D11]"
          >{allSelected ? 'Deselect all' : 'Select all'}</button>
        )}
      </div>

      {scanResult?.plants?.length === 0 && (
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-4 text-center">
          <p className="font-plant text-[#1C2E10] text-sm">No plants detected.</p>
          <p className="font-ui text-xs text-[#5F5E5A] mt-1">Try a closer photo or photograph plants individually.</p>
        </div>
      )}

      <div className="space-y-2">
        {scanResult?.plants?.map((p) => {
          const isSelected = !!selected[p.id];
          const lowConf = (p.confidence || 0) < 0.65;
          const e = edits[p.id] || {};
          return (
            <article
              key={p.id}
              data-testid="room-scan-card"
              data-selected={isSelected ? 'true' : 'false'}
              data-low-conf={lowConf ? 'true' : 'false'}
              className={`relative rounded-[14px] p-3 transition-all duration-200 ${
                isSelected
                  ? (lowConf ? 'border-[1.5px] border-[#BA7517] bg-[#F7EED9]' : 'border-2 border-[#3B6D11] bg-[#FDFAF6]')
                  : 'border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] opacity-50'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSelected(p.id)}
                aria-label={isSelected ? 'Deselect' : 'Select'}
                data-testid="room-scan-card-toggle"
                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-[#3B6D11] text-[#EAF3DE]' : 'bg-[#EDE5D8] text-[#888780]'
                }`}
              >
                {isSelected ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </button>
              <div className="flex gap-3">
                <PlantImage
                  src={crops[p.id] || null}
                  tone="plant"
                  rounded="sm"
                  className="w-20 h-20 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 pr-8">
                  <p className="font-plant text-sm text-[#1C2E10] truncate">{p.commonName}</p>
                  <p className="font-latin text-[10px] text-[#639922] truncate">{p.latinName}</p>
                  <p className="font-latin text-[10px] text-[#888780] mt-0.5">
                    {e.nickname ? `${e.nickname} · ` : ''}
                    <span className={lowConf ? 'text-[#BA7517]' : ''}>{Math.round((p.confidence || 0) * 100)}% confident</span>
                  </p>
                  {lowConf && p.notes && (
                    <p className="italic font-plant text-[11px] text-[#5F5E5A] mt-1 line-clamp-2">“{p.notes}”</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-[#EDE5D8] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3B6D11]" style={{ width: `${p.healthScore || 80}%` }} />
                    </div>
                    <span className="font-plant text-xs text-[#1C2E10]">{p.healthScore || 80}</span>
                  </div>
                  <details className="mt-2">
                    <summary className="font-plant uppercase tracking-[0.08em] text-[10px] text-[#3B6D11] cursor-pointer hover:text-[#2D5016] inline-flex items-center gap-1">
                      <Edit3 className="h-3 w-3" /> Edit details
                    </summary>
                    <div className="mt-2 space-y-2 pt-2 border-t-[0.5px] border-[#D3C9B8]">
                      <div>
                        <label className="font-ui text-[10px] uppercase tracking-[0.1em] text-[#888780] block mb-1">Nickname</label>
                        <input
                          value={e.nickname || ''}
                          onChange={(ev) => setEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], nickname: ev.target.value } }))}
                          className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[6px] px-2 py-1.5 text-xs font-ui"
                        />
                      </div>
                      <div>
                        <label className="font-ui text-[10px] uppercase tracking-[0.1em] text-[#888780] block mb-1">Watering</label>
                        <div className="flex flex-wrap gap-1">
                          {FREQ_CHIPS.map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setEdits(prev => ({ ...prev, [p.id]: { ...prev[p.id], watering_frequency_days: d } }))}
                              className={`rounded-[16px] border-[0.5px] px-2 py-1 text-[11px] font-ui ${e.watering_frequency_days === d ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]' : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17]'}`}
                            >{d}d</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Single room selector for the batch */}
      {scanResult?.plants?.length > 0 && (
        <div className="mt-4">
          <label className="font-ui text-[10px] uppercase tracking-[0.1em] text-[#888780] block mb-1.5">Room (applies to all selected)</label>
          <div className="flex flex-wrap gap-1.5">
            {ROOMS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRoom(prev => prev === r ? '' : r)}
                className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui ${room === r ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]' : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17]'}`}
              >{r}</button>
            ))}
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      {scanResult?.plants?.length > 0 && (
        <div className="fixed left-0 right-0 bottom-[68px] px-4 py-3 bg-gradient-to-t from-[#F5F0E8] to-transparent">
          <div className="max-w-[520px] mx-auto">
            <button
              onClick={handleAddBatch}
              disabled={selectedCount === 0}
              data-testid="room-scan-add-batch"
              className="relative overflow-hidden w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3.5 bg-[#1C2E10] text-[#F5F0E8] border-[0.5px] border-[#1C2E10] hover:bg-[#2D5016] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {selectedCount === 0 ? 'Select at least one plant' : `Add ${selectedCount} plant${selectedCount === 1 ? '' : 's'} to grove`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
