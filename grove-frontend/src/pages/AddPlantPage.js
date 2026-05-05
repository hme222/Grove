import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { plantAPI, speciesAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'sonner';
import { ArrowLeft, Search, Camera, Home, Edit3 } from 'lucide-react';
import PhotoRequirement from '../components/PhotoRequirement';
import PlantIdentifyScreen from './PlantIdentifyScreen';
import { useAuth } from '../contexts/AuthContext';
import { impactLight } from '../lib/haptics';

const ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Balcony', 'Patio', 'Greenhouse', 'Hallway', 'Dining Room'];
const MEDIUMS = [
  { value: 'soil', label: 'Soil' },
  { value: 'leca', label: 'LECA' },
  { value: 'water', label: 'Water' },
  { value: 'propagation_jar', label: 'Propagation Jar' },
  { value: 'other', label: 'Other' },
];
const SOURCES = [
  { value: 'nursery', label: 'Nursery' },
  { value: 'swap', label: 'Plant Swap' },
  { value: 'propagation', label: 'Propagation' },
  { value: 'gift', label: 'Gift' },
];

// ---- Outer page: dispatches between modes ----
export default function AddPlantPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // mode: 'chooser' | 'identify' | 'room' | 'manual'
  const initialMode = user?.prefer_manual_plant_entry ? 'manual' : 'chooser';
  const [mode, setMode] = useState(initialMode);

  if (mode === 'identify') {
    return <PlantIdentifyScreen onSwitchToManual={() => setMode('manual')} />;
  }
  if (mode === 'manual') {
    return <ManualEntryFlow onBack={() => setMode('chooser')} />;
  }
  // Chooser
  const opts = [
    {
      key: 'manual',
      icon: Edit3,
      title: 'Enter details manually',
      desc: 'The default way in. You know your plant — just type the basics.',
      testId: 'add-option-manual',
      onClick: () => setMode('manual'),
    },
    {
      key: 'identify',
      icon: Camera,
      title: 'Identify with a photo',
      desc: 'Take one photo and Grove suggests the species and care defaults. Always optional.',
      testId: 'add-option-identify',
      onClick: () => setMode('identify'),
    },
  ];
  return (
    <div className="max-w-[520px] mx-auto px-4 py-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1 font-plant uppercase tracking-[0.08em] text-[10px] text-[#1C2E10] hover:text-[#3B6D11]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <h1 className="font-plant text-[#1C2E10] text-xl mb-1">Add to your collection</h1>
      <p className="font-plant italic text-[#5F5E5A] text-xs mb-5">Two ways in — both equally good.</p>
      <div className="space-y-2">
        {opts.map(({ key, icon: Icon, title, desc, testId, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={(e) => { impactLight(e.currentTarget); onClick(); }}
            data-testid={testId}
            className="w-full text-left rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-3.5 py-4 hover:border-[#3B6D11] hover:bg-[#F5F0E8] flex items-start gap-3 transition-colors duration-150"
          >
            <div className="w-10 h-10 rounded-[10px] bg-[#EAF3DE] flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-[#3B6D11]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-plant text-[#1C2E10] text-base leading-tight">{title}</p>
              <p className="font-ui text-xs text-[#5F5E5A] mt-1 leading-snug">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Manual entry flow (legacy two-step preserved verbatim) ----
function ManualEntryFlow({ onBack }) {
  const navigate = useNavigate();
  const [species, setSpecies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [showSearch, setShowSearch] = useState(true);
  const [step, setStep] = useState('details');
  const [formData, setFormData] = useState({
    common_name: '', latin_name: '', nickname: '',
    room: '', grow_medium: 'soil', acquired_from: '',
    notes: '', watering_frequency_days: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const search = async () => {
      try {
        const res = await speciesAPI.search(searchQuery);
        setSpecies(res.data);
      } catch (e) { /* ignore */ }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectSpecies = (sp) => {
    setSelectedSpecies(sp);
    setFormData(prev => ({
      ...prev,
      common_name: sp.common_name,
      latin_name: sp.latin_name,
      watering_frequency_days: sp.default_watering_days,
    }));
    setShowSearch(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.common_name) {
      toast.error('Plant name is required');
      return;
    }
    setStep('photo');
  };

  const handlePhotoReady = async (photoPath) => {
    setSaving(true);
    try {
      await plantAPI.create({
        ...formData,
        species_id: selectedSpecies?.id || null,
        photo_url: photoPath,
      });
      toast.success(`${formData.nickname || formData.common_name} added to your collection`);
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add plant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={step === 'photo' ? 'Add a photo' : 'Add a plant'}
        rightContent={
          <button
            onClick={() => step === 'photo' ? setStep('details') : onBack()}
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
          >
            {step === 'photo' ? 'Back' : 'Cancel'}
          </button>
        }
      />
      {step === 'photo' ? (
        <div>
          <PhotoRequirement
            plantName={formData.nickname || formData.common_name}
            onBack={() => setStep('details')}
            onPhotoReady={handlePhotoReady}
          />
          {saving && (
            <div className="fixed inset-0 bg-[#1C2E10]/50 z-50 flex items-center justify-center">
              <div className="bg-[#F5F0E8] rounded-[14px] p-5 text-center">
                <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="font-plant text-[#1C2E10] text-sm">Adding to your grove\u2026</p>
              </div>
            </div>
          )}
        </div>
      ) : (
      <div className="max-w-[600px] mx-auto px-4 py-4">
        {showSearch ? (
          <div>
            <div className="mb-4">
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Search Species</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D3C9B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="species-search-input"
                  className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] pl-10 pr-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                  placeholder="Search by common or latin name..."
                />
              </div>
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {species.map(sp => (
                <button
                  key={sp.id}
                  onClick={() => selectSpecies(sp)}
                  data-testid="species-option"
                  className="w-full text-left rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] px-4 py-3 hover:border-[#2D5016] transition-colors duration-150"
                >
                  <p className="font-plant text-[#1C2E10] text-sm">{sp.common_name}</p>
                  <p className="font-latin text-[10px] text-[#2B2B26]">{sp.latin_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-ui text-[#639922]">{sp.toxicity}</span>
                    <span className="text-[10px] font-ui text-[#D3C9B8]">\u00B7</span>
                    <span className="text-[10px] font-ui text-[#2B2B26]">Water every {sp.default_watering_days}d</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSearch(false)}
              className="w-full mt-4 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
            >
              Or add custom plant
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedSpecies && (
              <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-3 flex items-center justify-between">
                <div>
                  <p className="font-plant text-[#1C2E10] text-sm">{selectedSpecies.common_name}</p>
                  <p className="font-latin text-[10px] text-[#2B2B26]">{selectedSpecies.latin_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedSpecies(null); setShowSearch(true); setFormData(prev => ({...prev, common_name: '', latin_name: ''})); }}
                  className="text-xs font-ui text-[#3B6D11] hover:text-[#2D5016]"
                >Change</button>
              </div>
            )}
            {!selectedSpecies && (
              <>
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Plant Name *</label>
                  <input
                    type="text"
                    value={formData.common_name}
                    onChange={(e) => setFormData(prev => ({...prev, common_name: e.target.value}))}
                    required
                    data-testid="plant-name-input"
                    className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                    placeholder="e.g., Monstera Deliciosa"
                  />
                </div>
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Latin Name</label>
                  <input
                    type="text"
                    value={formData.latin_name}
                    onChange={(e) => setFormData(prev => ({...prev, latin_name: e.target.value}))}
                    className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-latin text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                    placeholder="e.g., Monstera deliciosa"
                  />
                </div>
              </>
            )}
            <div>
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Nickname</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({...prev, nickname: e.target.value}))}
                data-testid="plant-nickname-input"
                className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                placeholder="Give your plant a name"
              />
            </div>
            <div>
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Room</label>
              <div className="flex flex-wrap gap-1.5">
                {ROOMS.map(room => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, room: prev.room === room ? '' : room}))}
                    className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui transition-colors duration-150 ${formData.room === room ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]' : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17] hover:border-[#2D5016]'}`}
                  >{room}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Grow Medium</label>
              <div className="flex flex-wrap gap-1.5">
                {MEDIUMS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, grow_medium: m.value}))}
                    className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui transition-colors duration-150 ${formData.grow_medium === m.value ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]' : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17] hover:border-[#2D5016]'}`}
                  >{m.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Acquired From</label>
              <div className="flex flex-wrap gap-1.5">
                {SOURCES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, acquired_from: prev.acquired_from === s.value ? '' : s.value}))}
                    className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui transition-colors duration-150 ${formData.acquired_from === s.value ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]' : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17] hover:border-[#2D5016]'}`}
                  >{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">
                Watering Frequency
                {formData.watering_frequency_days && (
                  <span className="text-[#639922] normal-case"> \u00B7 Every {formData.watering_frequency_days} days</span>
                )}
              </label>
              <div className="flex gap-1.5">
                {[3, 5, 7, 10, 14, 21].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, watering_frequency_days: days}))}
                    className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui transition-colors duration-150 ${formData.watering_frequency_days === days ? 'border-[#1C2E10] bg-[#1C2E10] text-[#F5F0E8]' : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1A1A17] hover:border-[#2D5016]'}`}
                  >{days}d</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5] resize-none h-24"
                placeholder="Any notes about your plant..."
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              data-testid="add-plant-submit"
              className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3.5 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016] disabled:opacity-50 transition-colors duration-150"
            >
              {saving ? 'Adding plant...' : 'Next \u2014 add a photo'}
            </button>
          </form>
        )}
      </div>
      )}
    </div>
  );
}
