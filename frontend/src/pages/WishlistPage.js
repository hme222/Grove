import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Scissors, X, Leaf } from 'lucide-react';
import { toast } from 'sonner';

export default function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await wishlistAPI.getAll();
      setItems(res.data);
    } catch (e) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleRemove = async (id) => {
    try {
      await wishlistAPI.remove(id);
      setItems((prev) => prev.filter(i => i.id !== id));
      toast.success('Removed from wishlist');
    } catch (e) {
      toast.error('Remove failed');
    }
  };

  return (
    <div>
      <PageHeader title="Wishlist" count={items.length} />

      <div className="max-w-[700px] mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#D4537E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12" data-testid="wishlist-empty">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#FBEAF0] border-[0.5px] border-[#D4537E]/30 flex items-center justify-center mb-3">
              <Scissors className="h-6 w-6 text-[#D4537E]" />
            </div>
            <p className="font-plant text-[#1C2E10] text-lg mb-1">Your wishlist is quiet</p>
            <p className="font-ui text-sm text-[#2B2B26]">
              React with <span className="font-plant">Cutting</span> on any post in the Grove to add a plant here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="wishlist-grid">
            {items.map(item => (
              <div
                key={item.id}
                data-testid="wishlist-item"
                className="flex items-center gap-3 rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] px-3 py-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#FBEAF0] border-[0.5px] border-[#D4537E]/30 flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-5 w-5 text-[#D4537E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-plant text-[#1C2E10] text-sm truncate">{item.common_name || 'Unknown plant'}</p>
                  {item.latin_name && (
                    <p className="font-latin text-[10px] text-[#2B2B26] italic truncate">{item.latin_name}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  aria-label="Remove from wishlist"
                  data-testid="wishlist-remove"
                  className="w-8 h-8 rounded-full border-[0.5px] border-[#D3C9B8] text-[#2B2B26] hover:border-[#D4537E] hover:text-[#D4537E] flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
