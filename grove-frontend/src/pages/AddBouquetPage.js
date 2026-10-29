import React, { useState } from 'react';
import { actionErrorMessage } from '../lib/errors';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { bouquetAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'sonner';

const OCCASIONS = ['wedding', 'birthday', 'anniversary', 'sympathy', 'gift', 'purchase', 'self', 'garden'];

export default function AddBouquetPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', occasion: '', notes: '', personal_note: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await bouquetAPI.create({
        ...formData,
        received_date: new Date().toISOString().split('T')[0],
      });
      toast.success('Bouquet added');
      navigate(`/bouquets/${res.data.id}`);
    } catch (e) {
      toast.error(actionErrorMessage(e, 'add the bouquet'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add bouquet"
        back
      />
      <div className="max-w-column mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="addbouquet-bouquet-name" className="font-ui text-sm text-grove-cream flex min-h-touch items-center">Bouquet name</label>
            <input id="addbouquet-bouquet-name" aria-label="Bouquet name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              data-testid="bouquet-name-input"
              className="w-full min-h-touch rounded-control border-hairline border-grove-moss bg-grove-canopy px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-sprout"
              placeholder="e.g., Birthday roses"
            />
          </div>

          <div>
            <p id="bouquet-occasion-label" className="font-ui text-xs text-grove-cream block mb-1.5">Occasion</p>
            <div role="group" aria-labelledby="bouquet-occasion-label" className="flex flex-wrap gap-2">
              {OCCASIONS.map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, occasion: prev.occasion === o ? '' : o}))}
                  aria-pressed={formData.occasion === o}
                  className={cn(buttonVariants({ variant: 'chip' }), "inline-flex items-center whitespace-nowrap")}
                    aria-pressed={formData.occasion === o}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="addbouquet-description" className="font-ui text-sm text-grove-cream flex min-h-touch items-center">Description</label>
            <textarea id="addbouquet-description" aria-label="Description"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              data-testid="bouquet-notes-input"
              className="w-full min-h-touch rounded-control border-hairline border-grove-moss bg-grove-canopy px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-sprout resize-none h-24"
              placeholder="Describe the flowers in your bouquet (helps with identification)…"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            data-testid="add-bouquet-submit"
            className={cn(buttonVariants(), "w-full disabled:opacity-50 transition-colors duration-150")}
          >
            {saving ? 'Adding…' : 'Add bouquet'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            data-testid="add-bouquet-cancel"
            className={cn(buttonVariants({ variant: 'outline' }), "w-full")}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
