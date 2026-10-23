import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      toast.success('Bouquet added!');
      navigate(`/bouquets/${res.data.id}`);
    } catch (e) {
      toast.error('Failed to add bouquet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add a bouquet"
        rightContent={
          <button onClick={() => navigate(-1)} className="rounded-[12px] font-ui text-xs px-3 py-2 border-[0.5px] border-grove-moss text-grove-cream">
            Cancel
          </button>
        }
      />
      <div className="max-w-[600px] mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-ui text-xs text-grove-cream block mb-1.5">Bouquet Name</label>
            <input aria-label="Bouquet name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              data-testid="bouquet-name-input"
              className="w-full bg-grove-bloom/15 border-[0.5px] border-grove-bloom/30 rounded-[8px] px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-blush/40 focus:outline-none focus:ring-2 focus:ring-grove-bloom"
              placeholder="e.g., Birthday roses"
            />
          </div>

          <div>
            <label className="font-ui text-xs text-grove-cream block mb-1.5">Occasion</label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, occasion: prev.occasion === o ? '' : o}))}
                  className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui capitalize transition-colors duration-150 ${
                    formData.occasion === o
                      ? 'border-grove-bloom bg-grove-bloom text-grove-root'
                      : 'border-grove-bloom/30 bg-grove-bloom/15 text-grove-blush hover:border-grove-bloom'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-ui text-xs text-grove-cream block mb-1.5">Description</label>
            <textarea aria-label="Description"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              data-testid="bouquet-notes-input"
              className="w-full bg-grove-bloom/15 border-[0.5px] border-grove-bloom/30 rounded-[8px] px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-blush/40 focus:outline-none focus:ring-2 focus:ring-grove-bloom resize-none h-24"
              placeholder="Describe the flowers in your bouquet (helps with AI identification)..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            data-testid="add-bouquet-submit"
            className="w-full rounded-[12px] font-ui text-xs px-4 py-3.5 border-[0.5px] bg-grove-bloom text-grove-root border-grove-bloom hover:bg-grove-sprout disabled:opacity-50 transition-colors duration-150"
          >
            {saving ? 'Adding...' : 'Add Bouquet'}
          </button>
        </form>
      </div>
    </div>
  );
}
