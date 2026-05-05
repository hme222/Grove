import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { floristAPI, uploadAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function FloristDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo_url: '',
    tags: [],
  });

  // Check tier access
  useEffect(() => {
    if (!loading && user && user.tier !== 'pro' && user.tier !== 'florist_pro') {
      toast.error('Florist Pro tier required');
      navigate('/profile');
    }
  }, [user, loading, navigate]);

  const fetchPortfolio = async () => {
    try {
      const res = await floristAPI.getPortfolio();
      setPortfolio(res.data);
    } catch (e) {
      if (e.response?.status === 403) {
        toast.error('Florist Pro tier required');
        navigate('/profile');
      } else {
        toast.error('Failed to load portfolio');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.upload(formData);
      setFormData(prev => ({ ...prev, photo_url: res.data.path }));
      toast.success('Image uploaded');
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      await floristAPI.addItem(formData);
      toast.success('Portfolio item added!');
      setShowCreate(false);
      setFormData({ title: '', description: '', photo_url: '', tags: [] });
      fetchPortfolio();
    } catch (e) {
      toast.error('Failed to add item');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this portfolio item?')) return;
    try {
      await floristAPI.deleteItem(id);
      toast.success('Item deleted');
      fetchPortfolio();
    } catch (e) {
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F0E8]">
        <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Florist Pro"
        count={portfolio.length}
        rightContent={
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button
                data-testid="florist-add-button"
                className="rounded-full w-9 h-9 bg-[#1C2E10] text-[#F5F0E8] flex items-center justify-center hover:bg-[#2D5016] transition-colors duration-150"
              >
                <Plus className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#FBFAF7] border-[0.5px] border-[#CBBFAE]">
              <DialogHeader>
                <DialogTitle className="font-plant text-[#141410]">Add Portfolio Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="font-sans text-xs uppercase tracking-[0.12em] text-[#141410] mb-2 block">
                    Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Spring Wedding Arrangement"
                    className="bg-[#FBFAF7] border-[0.5px] border-[#CBBFAE]"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs uppercase tracking-[0.12em] text-[#141410] mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about this arrangement"
                    className="bg-[#FBFAF7] border-[0.5px] border-[#CBBFAE]"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs uppercase tracking-[0.12em] text-[#141410] mb-2 block">
                    Photo
                  </label>
                  {formData.photo_url ? (
                    <div className="relative">
                      <img
                        src={getFileUrl(formData.photo_url)}
                        alt="Preview"
                        className="w-full h-48 bg-[#FDF5F8] object-contain rounded-[8px] border-[0.5px] border-[#CBBFAE]"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, photo_url: '' })}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full border-[0.5px] border-[#CBBFAE]"
                      >
                        <Trash2 className="h-4 w-4 text-[#B42318]" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 border-[0.5px] border-dashed border-[#CBBFAE] rounded-[8px] cursor-pointer hover:border-[#8A6A3D] transition-colors">
                      <ImageIcon className="h-8 w-8 text-[#8A6A3D] mb-2" />
                      <span className="text-sm text-[#3B3A33]">
                        {uploading ? 'Uploading...' : 'Click to upload'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full rounded-[2px] font-[Georgia] uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#1C2E10] text-[#F5F0E8]"
                >
                  {creating ? 'Adding...' : 'Add to Portfolio'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="max-w-[1100px] mx-auto px-4 py-4">
        {/* Pro Badge */}
        <div className="rounded-[14px] border-[0.5px] border-[#CBBFAE] bg-[#FBFAF7] p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-[20px] bg-[#8A6A3D] text-white text-xs font-sans uppercase tracking-[0.12em]">
              Pro
            </div>
            <div>
              <h3 className="font-plant text-[#141410] text-base">Florist Pro Active</h3>
              <p className="text-xs text-[#3B3A33] mt-0.5">
                Portfolio, care sheet generator, and sourcing insights
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {portfolio.length === 0 ? (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-6 text-center">
            <p className="text-sm text-[#2B2B26] mb-3">Your portfolio is empty</p>
            <p className="text-xs text-[#3B3A33]">Add arrangements to showcase your work</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="rounded-[14px] border-[0.5px] border-[#CBBFAE] bg-[#FBFAF7] overflow-hidden"
                data-testid="portfolio-item"
              >
                {item.photo_url ? (
                  <img
                    src={getFileUrl(item.photo_url)}
                    alt={item.title}
                    className="w-full aspect-square bg-[#FDF5F8] object-contain"
                  />
                ) : (
                  <div className="w-full aspect-square bg-[#EDE5D8] flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-[#D3C9B8]" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-plant text-[#141410] text-sm truncate">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-[#3B3A33] mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="mt-2 text-xs text-[#B42318] hover:underline"
                    data-testid="portfolio-delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
