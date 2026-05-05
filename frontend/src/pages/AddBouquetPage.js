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
          <button onClick={() => navigate(-1)} className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] text-[#1C2E10]">
            Cancel
          </button>
        }
      />
      <div className="max-w-[600px] mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Bouquet Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              data-testid="bouquet-name-input"
              className="w-full bg-[#FBEAF0] border-[0.5px] border-[#D4537E]/30 rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D4537E]/40 focus:outline-none focus:ring-2 focus:ring-[#D4537E]"
              placeholder="e.g., Birthday roses"
            />
          </div>

          <div>
            <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Occasion</label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, occasion: prev.occasion === o ? '' : o}))}
                  className={`rounded-[20px] border-[0.5px] px-3 py-1.5 text-xs font-ui capitalize transition-colors duration-150 ${
                    formData.occasion === o
                      ? 'border-[#D4537E] bg-[#D4537E] text-white'
                      : 'border-[#D4537E]/30 bg-[#FBEAF0] text-[#D4537E] hover:border-[#D4537E]'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Description</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              data-testid="bouquet-notes-input"
              className="w-full bg-[#FBEAF0] border-[0.5px] border-[#D4537E]/30 rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D4537E]/40 focus:outline-none focus:ring-2 focus:ring-[#D4537E] resize-none h-24"
              placeholder="Describe the flowers in your bouquet (helps with AI identification)..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            data-testid="add-bouquet-submit"
            className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3.5 border-[0.5px] bg-[#D4537E] text-white border-[#D4537E] hover:bg-[#b8446a] disabled:opacity-50 transition-colors duration-150"
          >
            {saving ? 'Adding...' : 'Add Bouquet'}
          </button>
        </form>
      </div>
    </div>
  );
}
