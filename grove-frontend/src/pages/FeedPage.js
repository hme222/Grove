import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedAPI, plantAPI, getFileUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import SectionTutorial from '../components/SectionTutorial';
import { toast } from 'sonner';
import { Heart, MessageCircle, Send, Leaf, Users, X, Sun, Scissors } from 'lucide-react';
import VerifiedProBadge from '../components/VerifiedProBadge';

// Decorative SVG used as a fallback when a post has no photo.
function BotanicalFallback({ tone = 'grove' }) {
  const stroke = tone === 'bloom' ? '#D4537E' : '#3B6D11';
  const bg = tone === 'bloom' ? '#FBEAF0' : '#EAF3DE';
  return (
    <div
      aria-hidden="true"
      data-testid="feed-fallback-illustration"
      className="w-full h-full flex items-center justify-center"
      style={{ background: bg }}
    >
      <svg viewBox="0 0 200 160" className="w-40 h-32" fill="none">
        <path d="M100 20 C 80 60, 70 90, 100 140" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M100 50 C 70 45, 60 60, 55 75 C 80 80, 95 70, 100 55 Z" stroke={stroke} strokeWidth="1.25" fill={stroke} fillOpacity="0.12" />
        <path d="M100 70 C 130 65, 145 80, 150 95 C 125 100, 108 90, 100 75 Z" stroke={stroke} strokeWidth="1.25" fill={stroke} fillOpacity="0.12" />
        <path d="M100 100 C 80 100, 70 110, 70 125 C 88 128, 98 120, 100 108 Z" stroke={stroke} strokeWidth="1.25" fill={stroke} fillOpacity="0.1" />
        <circle cx="100" cy="18" r="3" fill={stroke} />
      </svg>
    </div>
  );
}

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="feed-lightbox"
      onClick={onClose}
      className="fixed inset-0 z-[250] bg-[#1C2E10]/90 flex items-center justify-center p-4"
    >
      <button
        onClick={onClose}
        aria-label="Close photo"
        data-testid="feed-lightbox-close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#F5F0E8]/20 text-[#F5F0E8] hover:bg-[#F5F0E8]/30 flex items-center justify-center transition-colors duration-150"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt="Expanded post"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded-[4px]"
      />
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [plants, setPlants] = useState([]);
  const [commentTexts, setCommentTexts] = useState({});
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [commentsData, setCommentsData] = useState({});
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await feedAPI.getFeed();
      setPosts(res.data.posts || []);
    } catch (e) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const res = await plantAPI.getAll();
        setPlants(res.data.plants || []);
      } catch (e) { /* ignore */ }
    };
    fetchPlants();
  }, []);

  const handlePost = async () => {
    if (!caption.trim()) return;
    setPosting(true);
    try {
      await feedAPI.createPost({
        post_type: 'plant_update',
        caption,
        plant_id: selectedPlantId || null,
      });
      toast.success('Posted!');
      setCaption('');
      setSelectedPlantId('');
      setShowCompose(false);
      fetchFeed();
    } catch (e) {
      toast.error('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleKudos = async (postId, hasKudos) => {
    try {
      if (hasKudos) {
        await feedAPI.removeKudos(postId);
      } else {
        await feedAPI.addKudos(postId);
      }
      fetchFeed();
    } catch (e) {
      toast.error('Failed to update kudos');
    }
  };

  const handleReaction = async (post, type) => {
    const active = (post.user_reactions || []).includes(type);
    try {
      if (active) {
        await feedAPI.removeReaction(post.id, type);
      } else {
        await feedAPI.addReaction(post.id, type);
        if (type === 'cutting') {
          toast.success('Added to your wishlist');
        }
      }
      fetchFeed();
    } catch (e) {
      toast.error('Reaction failed');
    }
  };

  const toggleComments = async (postId) => {
    const next = new Set(expandedComments);
    if (next.has(postId)) {
      next.delete(postId);
    } else {
      next.add(postId);
      if (!commentsData[postId]) {
        try {
          const res = await feedAPI.getComments(postId);
          setCommentsData(prev => ({ ...prev, [postId]: res.data }));
        } catch (e) { /* ignore */ }
      }
    }
    setExpandedComments(next);
  };

  const handleComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    try {
      const res = await feedAPI.createComment(postId, { body: text });
      setCommentsData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data]
      }));
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      fetchFeed();
    } catch (e) {
      toast.error('Failed to comment');
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div>
      <SectionTutorial tutorialId="grove" />
      <PageHeader
        title="Grove"
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/groves')}
              data-testid="feed-open-groves-button"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] text-[#1C2E10] hover:border-[#3B6D11] transition-colors duration-150 flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              Groves
            </button>
            <button
              onClick={() => setShowCompose(!showCompose)}
              data-testid="feed-compose-button"
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] bg-[#5DCAA5] text-white border-[#5DCAA5] hover:bg-[#4ab08d] transition-colors duration-150"
            >
              Post Update
            </button>
          </div>
        }
      />

      <div className="max-w-[600px] mx-auto px-4 py-4 space-y-4">
        {/* Compose */}
        {showCompose && (
          <div className="rounded-[14px] border-[0.5px] border-[#5DCAA5] bg-[#EDE5D8] p-4" data-testid="feed-compose-form">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share a plant update..."
              data-testid="feed-caption-input"
              className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] p-3 text-sm font-ui placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5] resize-none h-20"
            />
            <div className="flex items-center justify-between mt-3">
              <select
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-3 py-2 text-xs font-ui text-[#1A1A17]"
              >
                <option value="">Tag a plant (optional)</option>
                {plants.map(p => (
                  <option key={p.id} value={p.id}>{p.nickname || p.common_name}</option>
                ))}
              </select>
              <button
                onClick={handlePost}
                disabled={posting || !caption.trim()}
                data-testid="feed-submit-post"
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-2 bg-[#5DCAA5] text-white border-[0.5px] border-[#5DCAA5] hover:bg-[#4ab08d] disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#5DCAA5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState config={EMPTY_STATES.feed_no_grove} />
        ) : (
          posts.map(post => {
            const isBouquet = post.post_type === 'bouquet';
            const tone = isBouquet ? 'bloom' : 'grove';
            const photoSrc = post.photo_url ? getFileUrl(post.photo_url) : null;
            return (
              <div
                key={post.id}
                data-testid="feed-post"
                className={`rounded-[14px] border-[0.5px] overflow-hidden ${
                  isBouquet ? 'border-[#D4537E]/30 bg-[#FBEAF0]' : 'border-[#D3C9B8] bg-[#EDE5D8]'
                }`}
              >
                {/* Hero media (photo-first; botanical SVG fallback when none) */}
                <button
                  type="button"
                  onClick={() => photoSrc && setLightboxSrc(photoSrc)}
                  data-testid="feed-post-media"
                  aria-label={photoSrc ? 'Open photo' : 'Post illustration'}
                  className={`block w-full aspect-[4/3] ${photoSrc ? 'cursor-zoom-in' : 'cursor-default'}`}
                >
                  {photoSrc ? (
                    <div className="w-full h-full bg-[#EAF3DE] flex items-center justify-center"><img src={photoSrc} alt={post.caption || 'Post photo'} className="max-w-full max-h-full w-auto h-auto object-contain" /></div>
                  ) : (
                    <BotanicalFallback tone={tone} />
                  )}
                </button>

                {/* Post header */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center border-[0.5px] border-[#D3C9B8]">
                    <span className="font-plant text-[#3B6D11] text-xs">
                      {(post.display_name || post.username || 'G')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-sm text-[#1C2E10] font-medium truncate flex items-center gap-1">
                      <span className="truncate">{post.display_name || post.username}</span>
                      <VerifiedProBadge user={post} size={14} />
                    </p>
                    <p className="font-latin text-[9px] text-[#2B2B26]">{formatTime(post.created_at)} ago</p>
                  </div>
                  {post.plant_name && (
                    <div className="flex items-center gap-1 rounded-[20px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] px-2 py-0.5">
                      <Leaf className="h-3 w-3 text-[#3B6D11]" />
                      <span className="font-plant text-[10px] text-[#1C2E10] truncate max-w-[100px]">{post.plant_name}</span>
                    </div>
                  )}
                </div>

                <div className="px-4 pb-3">
                  {post.caption && (
                    <p className="font-ui text-sm text-[#1A1A17] mt-1.5">{post.caption}</p>
                  )}
                  {post.plant_latin_name && (
                    <p className="font-latin text-[10px] text-[#2B2B26] mt-0.5">{post.plant_latin_name}</p>
                  )}

                  {/* Actions: 3 reactions (leaf / light / cutting) + comments */}
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t-[0.5px] border-[#D3C9B8]/40 flex-wrap" data-testid="feed-reactions-row">
                    {[
                      { type: 'leaf', label: 'Leaf', Icon: Leaf, activeColor: '#3B6D11' },
                      { type: 'light', label: 'Light', Icon: Sun, activeColor: '#C18A2A' },
                      { type: 'cutting', label: 'Cutting', Icon: Scissors, activeColor: '#D4537E' },
                    ].map(({ type, label, Icon, activeColor }) => {
                      const count = post.reactions?.[type] || 0;
                      const active = (post.user_reactions || []).includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => handleReaction(post, type)}
                          data-testid={`feed-reaction-${type}`}
                          aria-pressed={active}
                          className={`flex items-center gap-1.5 text-xs font-ui px-2 py-1 rounded-[20px] border-[0.5px] transition-colors duration-150 ${
                            active
                              ? 'border-transparent text-white'
                              : 'border-[#D3C9B8] bg-[#F5F0E8] text-[#2B2B26] hover:border-[#3B6D11]'
                          }`}
                          style={active ? { backgroundColor: activeColor } : undefined}
                        >
                          <Icon className="h-3.5 w-3.5" fill={active ? 'currentColor' : 'none'} />
                          <span className="font-plant uppercase tracking-[0.08em] text-[10px]">{label}</span>
                          {count > 0 && <span className="font-latin text-[10px]">{count}</span>}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => toggleComments(post.id)}
                      data-testid="feed-comments-button"
                      className="flex items-center gap-1.5 text-xs font-ui text-[#2B2B26] hover:text-[#5DCAA5] transition-colors duration-150 ml-auto"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comment_count || 0}
                    </button>
                  </div>

                  {/* Comments */}
                  {expandedComments.has(post.id) && (
                    <div className="mt-3" data-testid="feed-comments-panel">
                      {/* Sticky conversation header */}
                      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-[#F5F0E8]/95 backdrop-blur border-y-[0.5px] border-[#D3C9B8]/60 flex items-center justify-between">
                        <p className="font-plant uppercase tracking-[0.12em] text-[10px] text-[#1C2E10]">
                          Conversation · {post.comment_count || 0}
                        </p>
                        <p className="font-latin text-[9px] text-[#2B2B26] truncate max-w-[60%]">
                          on {post.display_name || post.username}’s post
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        {(commentsData[post.id] || []).map(c => (
                          <div key={c.id} className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#EAF3DE] flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-plant text-[#3B6D11]">{(c.display_name || c.username || 'G')[0].toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs"><span className="font-medium text-[#1C2E10]">{c.username}</span> <span className="text-[#2B2B26]">{c.body}</span></p>
                              {c.photo_url && (
                                <button
                                  type="button"
                                  onClick={() => setLightboxSrc(getFileUrl(c.photo_url))}
                                  data-testid="feed-comment-photo"
                                  className="mt-1.5 block rounded-[8px] overflow-hidden border-[0.5px] border-[#D3C9B8] w-32 h-32 cursor-zoom-in"
                                >
                                  <img src={getFileUrl(c.photo_url)} alt="Comment photo" className="w-full h-full object-cover" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={commentTexts[post.id] || ''}
                            onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                            placeholder="Write a comment..."
                            data-testid="feed-comment-input"
                            className="flex-1 bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-3 py-1.5 text-xs font-ui placeholder:text-[#D3C9B8] focus:outline-none focus:ring-1 focus:ring-[#5DCAA5]"
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            data-testid="feed-comment-submit"
                            className="rounded-full w-7 h-7 bg-[#5DCAA5] text-white flex items-center justify-center hover:bg-[#4ab08d]"
                          >
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
