import { LoadErrorPage } from '../components/LoadError';
import Loading from '../components/Loading';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { floristAPI, uploadAPI } from '../lib/api';
import { getFileUrl } from '../lib/api';
import { PageHeader, HeaderAction } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ConfirmDialog';

export default function FloristDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState(null); // portfolio item id awaiting delete confirmation
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
      setLoadError(false);
      const res = await floristAPI.getPortfolio();
      setPortfolio(res.data);
    } catch (e) {
      if (e.response?.status === 403) {
        toast.error('Florist Pro tier required');
        navigate('/profile');
      } else {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleDelete = (id) => setPending(id);

  const performDelete = async (id) => {
    try {
      await floristAPI.deleteItem(id);
      toast.success('Item deleted');
      fetchPortfolio();
    } catch (e) {
      toast.error('Failed to delete item');
    }
  };

  if (loadError) {
    return <LoadErrorPage back title="Florist Pro" onRetry={fetchPortfolio} />;
  }
  if (loading) {
    return (
      <Loading label="Loading" className="min-h-screen bg-grove-forest" />
    );
  }

  return (
    <div>
      <PageHeader back
        title="Florist Pro"
        rightContent={
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <HeaderAction icon={Plus} data-testid="florist-add-button">
                Add
              </HeaderAction>
            </DialogTrigger>
            <DialogContent className="bg-grove-canopy border-hairline border-grove-moss">
              <DialogHeader>
                <DialogTitle className="font-plant text-grove-cream">Add Portfolio Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label htmlFor="florist-title" className="font-ui text-xs text-grove-cream mb-2 block">
                    Title
                  </label>
                  <Input id="florist-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Spring Wedding Arrangement"
                    className="bg-grove-canopy border-hairline border-grove-moss"
                  />
                </div>
                <div>
                  <label htmlFor="florist-description" className="font-ui text-xs text-grove-cream mb-2 block">
                    Description
                  </label>
                  <Textarea id="florist-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about this arrangement"
                    className="bg-grove-canopy border-hairline border-grove-moss"
                  />
                </div>
                <div>
                  <span id="florist-photo-label" className="font-ui text-xs text-grove-cream mb-2 block">
                    Photo
                  </span>
                  {formData.photo_url ? (
                    <div className="relative">
                      <img
                        src={getFileUrl(formData.photo_url)}
                        alt="Preview"
                        className="w-full h-48 bg-grove-bloom/15 object-contain rounded-inset border-hairline border-grove-moss"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, photo_url: '' })}
                        aria-label="Remove photo"
                        className="absolute top-2 right-2 p-2.5 bg-grove-canopy rounded-full border-hairline border-grove-moss"
                      >
                        <Trash2 className="h-4 w-4 text-grove-blush" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 border-hairline border-dashed border-grove-moss rounded-inset cursor-pointer hover:border-grove-moss transition-colors">
                      <ImageIcon className="h-8 w-8 text-grove-sun mb-2" />
                      <span className="text-sm text-grove-cream">
                        {uploading ? 'Uploading…' : 'Click to upload'}
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
                  className="w-full"
                >
                  {creating ? 'Adding…' : 'Add to portfolio'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="max-w-page mx-auto px-4 py-4">
        {/* Pro Badge */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center px-2.5 py-1 rounded-pill border-hairline border-grove-sun bg-grove-canopy text-grove-sun text-xs font-ui min-h-6">
              Pro
            </div>
            <div>
              <h3 className="font-plant text-grove-cream text-base font-semibold">Florist Pro Active</h3>
              <p className="text-xs text-grove-cream mt-0.5">
                Portfolio, care sheet generator, and sourcing insights
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {portfolio.length === 0 ? (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-center">
            <p className="text-sm text-grove-cream mb-3">Your portfolio is empty</p>
            <p className="text-xs text-grove-cream">Add arrangements to showcase your work</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="rounded-card border-hairline border-grove-moss bg-grove-canopy overflow-hidden"
                data-testid="portfolio-item"
              >
                {item.photo_url ? (
                  <img
                    src={getFileUrl(item.photo_url)}
                    alt={item.title}
                    className="w-full aspect-square bg-grove-bloom/15 object-contain"
                  />
                ) : (
                  <div className="w-full aspect-square bg-grove-moss flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-grove-sage" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-plant text-grove-cream text-base font-semibold  truncate">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-grove-cream mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="mt-2 text-xs text-grove-blush hover:underline"
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
      <ConfirmDialog
        open={pending != null}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title="Delete this portfolio item?"
        description="The item is removed from your portfolio. This can't be undone."
        confirmLabel="Delete item"
        testId="portfolio-delete-confirm"
        onConfirm={() => { const t = pending; setPending(null); performDelete(t); }}
      />
    </div>
  );
}
