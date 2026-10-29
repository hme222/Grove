import React, { useState, useEffect, useCallback, useRef } from 'react';
import { saveErrorMessage } from '../lib/errors';
import { Spinner } from '../components/Loading';
import LoadError from '../components/LoadError';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { plantAPI, speciesAPI, encyclopediaAPI } from '../lib/api';
import PhotoBand from '../components/PhotoBand';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'sonner';
import { Search, Camera } from 'lucide-react';
import PhotoRequirement from '../components/PhotoRequirement';
import ToxicityBadge from '../components/ToxicityBadge';
import PlantIdentifyScreen from './PlantIdentifyScreen';
import { useAuth } from '../contexts/AuthContext';
import { impactLight } from '../lib/haptics';

const ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Balcony', 'Patio', 'Greenhouse', 'Hallway', 'Dining Room'];
const MEDIUMS = [
  { value: 'soil', label: 'Soil' },
  { value: 'leca', label: 'LECA' },
  { value: 'bark', label: 'Bark', orchidOnly: true },
  { value: 'water', label: 'Water' },
  { value: 'propagation_jar', label: 'Propagation jar' },
  { value: 'other', label: 'Other' },
];
const SOURCES = [
  { value: 'nursery', label: 'Nursery' },
  { value: 'swap', label: 'Plant swap' },
  { value: 'propagation', label: 'Propagation' },
  { value: 'gift', label: 'Gift' },
];

// ---- Outer page: dispatches between modes ----
export default function AddPlantPage() {
  const { user } = useAuth();
  // mode: 'chooser' | 'identify' | 'room' | 'manual'
  // Arriving from a species page ('Add to my plants') goes straight to the form with that species chosen.
  const speciesFromLink = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('species') : null;
  const nameFromLink = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('name') : null;
  const initialMode = speciesFromLink || user?.prefer_manual_plant_entry ? 'manual' : 'chooser';
  const [mode, setMode] = useState(initialMode);
  // True once the person chose "Search by name" themselves, so focus follows them into the form.
  const switchedByPerson = useRef(false);
  const goManual = () => { switchedByPerson.current = true; setMode('manual'); };

  if (mode === 'identify') {
    return <PlantIdentifyScreen onSwitchToManual={goManual} />;
  }
  if (mode === 'manual') {
    return <ManualEntryFlow onBack={() => setMode('chooser')} presetSpeciesId={speciesFromLink} presetName={nameFromLink} focusSearch={switchedByPerson.current} />;
  }
  // Chooser
  const opts = [
    {
      key: 'manual',
      icon: Search,
      title: 'Search by name',
      desc: 'Pick your plant from our guide and we fill in the care for you.',
      testId: 'add-option-manual',
      onClick: goManual,
    },
    {
      key: 'identify',
      icon: Camera,
      title: 'Identify with a photo',
      desc: 'Take one photo and FloraGrove suggests the species and care defaults. Always optional.',
      testId: 'add-option-identify',
      onClick: () => setMode('identify'),
    },
  ];
  return (
    <div>
      <PageHeader title="Add a plant" back />
      <div className="max-w-form mx-auto px-4 py-4">
      <PhotoBand src="/photos/sprout-1.jpg" ratio="short" className="mb-4" eager />
      <p className="font-ui italic text-grove-sage text-xs font-medium mb-5">Start with a name or a photo.</p>
      <div className="space-y-2">
        {opts.map(({ key, icon: Icon, title, desc, testId, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={(e) => { impactLight(e.currentTarget); onClick(); }}
            data-testid={testId}
            className="w-full text-left rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-3 hover:border-grove-fernLine hover:bg-grove-forest flex items-start gap-3 transition-colors duration-150"
          >
            <div className="w-10 h-10 rounded-chip bg-grove-moss flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-grove-sprout" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-plant text-grove-cream text-base leading-tight">{title}</p>
              <p className="font-ui text-xs text-grove-sage mt-1 leading-snug">{desc}</p>
            </div>
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}

// ---- Manual entry flow (legacy two-step preserved verbatim) ----
function ManualEntryFlow({ onBack, presetSpeciesId, presetName, focusSearch }) {
  const navigate = useNavigate();
  const [species, setSpecies] = useState([]);
  const [searchQuery, setSearchQuery] = useState(presetName || '');
  const searchRef = useRef(null);
  // Switching from the chooser to the form moves focus to the search field, so a keyboard or screen-reader user lands on it.
  useEffect(() => { if (focusSearch) searchRef.current?.focus(); }, [focusSearch]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [showSearch, setShowSearch] = useState(true);
  const [step, setStep] = useState('details');
  const [formData, setFormData] = useState({
    common_name: '', latin_name: '', nickname: '',
    room: '', grow_medium: 'soil', acquired_from: '',
    notes: '', watering_frequency_days: null,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [searchFailed, setSearchFailed] = useState(false);
  const runSearch = useCallback(async () => {
    try {
      const res = await speciesAPI.search(searchQuery);
      setSpecies(res.data);
      setSearchFailed(false);
    } catch (e) {
      // Only say so once the person has typed something; the empty-query load runs on its own.
      setSearchFailed(searchQuery.trim().length > 0);
    }
  }, [searchQuery]);
  useEffect(() => {
    const timer = setTimeout(runSearch, 300);
    return () => clearTimeout(timer);
  }, [runSearch]);

  // A species chosen on its own page is looked up once and applied as if it had been picked from search.
  const [presetFailed, setPresetFailed] = useState(false);
  const loadPreset = useCallback(async () => {
    if (!presetSpeciesId) return;
    try {
      const res = await encyclopediaAPI.getSpeciesDetail(presetSpeciesId);
      if (res?.data) { selectSpecies(res.data); setPresetFailed(false); }
    } catch {
      setPresetFailed(true);
    }
  }, [presetSpeciesId]);
  useEffect(() => { loadPreset(); }, [loadPreset]);

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
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  };

  const handlePhotoReady = async (photoPath) => {
    setSaving(true);
    setSaveError('');
    try {
      await plantAPI.create({
        ...formData,
        species_id: selectedSpecies?.id || null,
        photo_url: photoPath || null,
        photo_deferred: !photoPath,
      });
      toast.success(`${formData.nickname || formData.common_name} added to your collection`);
      navigate('/plants');
    } catch (e) {
      // A toast fades; the message stays beside the button that failed until the next try.
      setSaveError(saveErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={step === 'photo' ? 'Add a photo' : 'Add a plant'}
        back={{ onClick: () => (step === 'photo' ? setStep('details') : onBack()), testId: 'add-plant-back' }}
      />
      {step === 'photo' ? (
        <div>
          {saveError && (
            <p role="alert" data-testid="add-plant-save-error" className="mx-4 mt-4 rounded-small border-hairline border-grove-bloom bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-cream">{saveError}</p>
          )}
          <PhotoRequirement
            plantName={formData.nickname || formData.common_name}
            onPhotoReady={handlePhotoReady}
            onSkip={() => handlePhotoReady(null)}
          />
          {saving && (
            <div className="fixed inset-0 bg-grove-lime/40 z-sheet flex items-center justify-center">
              <div className="bg-grove-forest rounded-small p-5 text-center" role="status">
                <Spinner className="mx-auto mb-2 block h-6 w-6" />
                <p className="font-ui text-grove-cream text-sm font-medium">Adding to your grove…</p>
              </div>
            </div>
          )}
        </div>
      ) : (
      <div className="max-w-column mx-auto px-4 py-4">
        {showSearch ? (
          <div>
            <div className="mb-4">
              <label htmlFor="addplant-search-species" className="font-ui text-xs text-grove-cream block mb-1.5">Search by name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grove-sage" />
                <input id="addplant-search-species"
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="species-search-input"
                  className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset pl-10 pr-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                  placeholder="Search by common or latin name…"
                />
              </div>
            </div>
            {presetFailed && (
              <div className="mb-4">
                <LoadError compact what={presetName ? `${presetName} from the plant guide` : 'the plant you chose'} note="You can still search for it above." onRetry={loadPreset} testId="preset-failed" />
              </div>
            )}
            {searchFailed && !presetFailed && (
              <div className="mb-4">
                <LoadError compact what="the plant search" note="You can still add a custom plant below." onRetry={runSearch} testId="search-failed" />
              </div>
            )}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {species.map(sp => (
                <button
                  key={sp.id}
                  onClick={() => selectSpecies(sp)}
                  data-testid="species-option"
                  className="w-full text-left rounded-inset border-hairline border-grove-moss bg-grove-moss px-4 py-3 hover:border-grove-fernLine transition-colors duration-150"
                >
                  <p className="font-ui text-grove-cream text-sm font-medium">{sp.common_name}</p>
                  <p className="font-latin text-xs text-grove-cream">{sp.latin_name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    <ToxicityBadge toxicity={sp.toxicity} size="sm" testId="species-option-toxicity" />
                    <span className="text-xs font-ui text-grove-cream">Check about every {sp.default_watering_days}d</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSearch(false)}
              className={cn(buttonVariants({ variant: 'outline' }), "w-full mt-4")}
            >
              Or add custom plant
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedSpecies && (
              <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 flex items-center justify-between">
                <div>
                  <p className="font-ui text-grove-cream text-sm font-medium">{selectedSpecies.common_name}</p>
                  <p className="font-latin text-xs text-grove-cream">{selectedSpecies.latin_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedSpecies(null); setShowSearch(true); setFormData(prev => ({...prev, common_name: '', latin_name: ''})); }}
                  className="text-xs font-ui text-grove-sprout hover:text-grove-sprout"
                >Change</button>
              </div>
            )}
            {!selectedSpecies && (
              <>
                <div>
                  <label htmlFor="addplant-plant-name" className="font-ui text-xs text-grove-cream block mb-1.5">Plant name *</label>
                  <input id="addplant-plant-name" aria-label="Plant name"
                    type="text"
                    value={formData.common_name}
                    onChange={(e) => setFormData(prev => ({...prev, common_name: e.target.value}))}
                    required
                    data-testid="plant-name-input"
                    className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                    placeholder="e.g., Monstera Deliciosa"
                  />
                </div>
                <div>
                  <label htmlFor="addplant-latin-name" className="font-ui text-xs text-grove-cream block mb-1.5">Latin name</label>
                  <input id="addplant-latin-name" aria-label="Latin name"
                    type="text"
                    value={formData.latin_name}
                    onChange={(e) => setFormData(prev => ({...prev, latin_name: e.target.value}))}
                    className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-4 py-3 text-sm font-latin text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                    placeholder="e.g., Monstera deliciosa"
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="addplant-nickname" className="font-ui text-xs text-grove-cream block mb-1.5">Nickname</label>
              <input id="addplant-nickname" aria-label="Nickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({...prev, nickname: e.target.value}))}
                data-testid="plant-nickname-input"
                className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                placeholder="Give your plant a name"
              />
            </div>
            <div>
              <p id="addplant-room-label" className="font-ui text-xs text-grove-cream block mb-1.5">Room</p>
              <div role="group" aria-labelledby="addplant-room-label" className="flex flex-wrap gap-1.5">
                {ROOMS.map(room => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, room: prev.room === room ? '' : room}))}
                    className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={formData.room === room}
                  >{room.charAt(0) + room.slice(1).toLowerCase()}</button>
                ))}
              </div>
            </div>
            <div>
              <p id="addplant-grow-medium-label" className="font-ui text-xs text-grove-cream block mb-1.5">Grow medium</p>
              <div role="group" aria-labelledby="addplant-grow-medium-label" className="flex flex-wrap gap-1.5">
                {MEDIUMS.filter(m => !m.orchidOnly || selectedSpecies?.family === 'Orchidaceae' || formData.grow_medium === 'bark').map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, grow_medium: m.value}))}
                    className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={formData.grow_medium === m.value}
                  >{m.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p id="addplant-acquired-from-label" className="font-ui text-xs text-grove-cream block mb-1.5">Acquired from</p>
              <div role="group" aria-labelledby="addplant-acquired-from-label" className="flex flex-wrap gap-1.5">
                {SOURCES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, acquired_from: prev.acquired_from === s.value ? '' : s.value}))}
                    className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={formData.acquired_from === s.value}
                  >{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p id="addplant-watering-label" className="font-ui text-xs text-grove-cream block mb-1.5">
                How often to check the soil
                {formData.watering_frequency_days && (
                  <span className="text-grove-sprout normal-case"> · about {formData.watering_frequency_days} days</span>
                )}
              </p>
              <div role="group" aria-labelledby="addplant-watering-label" className="flex flex-wrap gap-1.5">
                {[3, 5, 7, 10, 14, 21, 28].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, watering_frequency_days: days}))}
                    className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={formData.watering_frequency_days === days}
                  >{days} days</button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="addplant-notes" className="font-ui text-xs text-grove-cream block mb-1.5">Notes</label>
              <textarea id="addplant-notes" aria-label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime resize-none h-24"
                placeholder="Any notes about your plant…"
              />
            </div>
            <p className="font-ui text-xs text-grove-sage" data-testid="add-plant-new-plant-note">
              Keep a new plant apart from your others for two weeks and check leaves and soil for pests. A few dropped leaves in the first weeks are normal; do not repot or feed right away.
            </p>
            <button
              type="submit"
              disabled={saving}
              data-testid="add-plant-submit"
              className={cn(buttonVariants(), "w-full disabled:opacity-50 transition-colors duration-150")}
            >
              {saving ? 'Adding plant…' : 'Next \u2014 add a photo'}
            </button>
          </form>
        )}
      </div>
      )}
    </div>
  );
}
