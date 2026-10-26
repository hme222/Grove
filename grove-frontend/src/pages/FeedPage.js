import LoadError from '../components/LoadError';
import { LoadingList } from '../components/Loading';
import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import useDialogA11y from '../lib/useDialogA11y';

import { AppLink } from '../components/AppLink';
import { feedAPI, plantAPI, getFileUrl } from '../lib/api';
import { PageHeader, HeaderAction } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { EMPTY_STATES } from '@/constants/emptyStates';
import SectionTutorial from '../components/SectionTutorial';
import { toast } from 'sonner';
import { MessageCircle, Send, Leaf, X, Sun, Scissors, ChevronRight, Plus } from 'lucide-react';
import VerifiedProBadge from '../components/VerifiedProBadge';

// Decorative SVG used as a fallback when a post has no photo.
function BotanicalFallback({ tone = 'grove' }) {
  const stroke = tone === 'bloom' ? 'var(--grove-bloom)' : 'var(--grove-lime)';
  const bg = tone === 'bloom' ? 'var(--grove-moss)' : 'var(--grove-canopy)';
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
  const ref = React.useRef(null);
  useDialogA11y(ref, onClose);
  return (
    <div
      role="presentation"
      data-testid="feed-lightbox"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-lightbox bg-scrim"
    >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged picture"
      ref={ref}
      tabIndex={-1}
      className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 focus:outline-none"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        data-testid="feed-lightbox-close"
        className="pointer-events-auto absolute top-4 right-4 min-h-touch min-w-touch rounded-full bg-grove-forest/20 text-grove-cream hover:bg-grove-forest/30 flex items-center justify-center transition-colors duration-150"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt="Expanded post"
        className="pointer-events-auto max-w-full max-h-full object-contain rounded-hairline"
      />
    </div>
    </div>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
      setLoadError(false);
    } catch (e) {
      setLoadError(true);
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

  // Try again keeps the error card up (it says "Trying again…") until the request settles, so a retry
  // can never flash an empty list or a zero.
  const retryLoad = async () => {
    await fetchFeed();
    document.getElementById('main-content')?.focus();
  };

  return (
    <div>
      <SectionTutorial tutorialId="grove" />
      <PageHeader
        title="Community"
      />

      <div className="max-w-column mx-auto px-4 py-4 space-y-4">
        <nav aria-label="Community areas" className="flex flex-wrap gap-2" data-testid="community-shortcuts">
          {[['Groves', '/groves'], ['Swaps', '/swaps'], ['Saved cuttings', '/wishlist']].map(([label, path]) => (
            <AppLink key={path} to={path} data-testid={`community-shortcut-${label.toLowerCase().replace(/ /g, '-')}`}
              className="inline-flex min-h-touch items-center gap-0.5 rounded-control pl-1 pr-2 font-ui text-sm text-grove-cream underline-offset-4 hover:underline">
              {label}
              <ChevronRight className="h-4 w-4 text-grove-sage" aria-hidden="true" />
            </AppLink>
          ))}
        </nav>
        {!loadError && (
          <div className="flex items-center justify-end">
            <HeaderAction icon={Plus} onClick={() => setShowCompose(!showCompose)} data-testid="feed-compose-button" pressed={showCompose}>
              Post an update
            </HeaderAction>
          </div>
        )}
        {/* Compose */}
        {showCompose && (
          <div className="rounded-card border-hairline border-grove-lime bg-grove-moss p-5" data-testid="feed-compose-form">
            <textarea aria-label="Share a plant update"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share a plant update…"
              data-testid="feed-caption-input"
              className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset p-3 text-sm font-ui placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime resize-none h-20"
            />
            <div className="flex items-center justify-between mt-3">
              <select aria-label="Tag a plant (optional)"
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="bg-grove-forest border-hairline border-grove-moss rounded-inset px-3 py-2 text-xs font-ui text-grove-cream"
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
                className={cn(buttonVariants(), "disabled:opacity-50 flex items-center gap-1.5")}
              >
                <Send className="h-3.5 w-3.5" />
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Feed */}
        {loadError && !loading ? (<LoadError what="community" onRetry={retryLoad} />) : loading ? (
          <LoadingList label="Loading the feed" />
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
                className={`rounded-card border-hairline overflow-hidden ${
                  isBouquet ? 'border-grove-bloom/30 bg-grove-bloom/15' : 'border-grove-moss bg-grove-moss'
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
                    <div className="w-full h-full bg-grove-moss flex items-center justify-center"><img src={photoSrc} alt="" className="max-w-full max-h-full w-auto h-auto object-contain" /></div>
                  ) : (
                    <BotanicalFallback tone={tone} />
                  )}
                </button>

                {/* Post header */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-grove-moss flex items-center justify-center border-hairline border-grove-moss">
                    <span className="font-ui text-grove-sprout text-xs font-medium">
                      {(post.display_name || post.username || 'G')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-sm text-grove-cream font-medium truncate flex items-center gap-1">
                      <span className="truncate">{post.display_name || post.username}</span>
                      <VerifiedProBadge user={post} size={14} />
                    </p>
                    <p className="font-latin text-xs text-grove-cream">{formatTime(post.created_at)} ago</p>
                  </div>
                  {post.plant_name && (
                    <div className="flex items-center gap-1 min-h-6 rounded-round border-hairline border-grove-moss bg-grove-canopy px-2.5 py-1">
                      <Leaf className="h-3 w-3 text-grove-sprout" />
                      <span className="font-ui text-xs font-medium text-grove-cream truncate max-w-chipLabel">{post.plant_name}</span>
                    </div>
                  )}
                </div>

                <div className="px-4 pb-3">
                  {post.caption && (
                    <p className="font-ui text-sm text-grove-cream mt-1.5">{post.caption}</p>
                  )}
                  {post.plant_latin_name && (
                    <p className="font-latin text-xs text-grove-cream mt-0.5">{post.plant_latin_name}</p>
                  )}

                  {/* Actions: 3 reactions (leaf / light / cutting) + comments */}
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t-hairline border-grove-moss/40 flex-wrap" data-testid="feed-reactions-row">
                    {[
                      { type: 'leaf', label: 'Leaf', Icon: Leaf, activeClass: 'bg-grove-lime text-grove-root' },
                      { type: 'light', label: 'Light', Icon: Sun, activeClass: 'bg-grove-sun text-grove-root' },
                      { type: 'cutting', label: 'Cutting', Icon: Scissors, activeClass: 'bg-grove-bloom text-grove-root' },
                    ].map(({ type, label, Icon, activeClass }) => {
                      const count = post.reactions?.[type] || 0;
                      const active = (post.user_reactions || []).includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => handleReaction(post, type)}
                          data-testid={`feed-reaction-${type}`}
                          aria-pressed={active}
                          className={`min-h-touch flex items-center gap-1.5 text-xs font-ui px-2 py-1 rounded-round border-hairline transition-colors duration-150 ${
                            active
                              ? `border-transparent ${activeClass}`
                              : 'border-grove-moss bg-grove-forest text-grove-cream hover:border-grove-fernLine'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" fill={active ? 'currentColor' : 'none'} />
                          <span className="font-ui text-xs font-medium">{label}</span>
                          {count > 0 && <span className="font-latin text-xs">{count}</span>}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => toggleComments(post.id)}
                      data-testid="feed-comments-button"
                      className="min-h-touch flex items-center gap-1.5 text-xs font-ui text-grove-cream hover:text-grove-sprout transition-colors duration-150 ml-auto px-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comment_count || 0}
                    </button>
                  </div>

                  {/* Comments */}
                  {expandedComments.has(post.id) && (
                    <div className="mt-3" data-testid="feed-comments-panel">
                      {/* Sticky conversation header */}
                      <div className="sticky top-0 z-raised -mx-4 px-4 py-2 bg-grove-forest/95 backdrop-blur border-y-hairline border-grove-moss/60 flex items-center justify-between">
                        <p className="font-ui text-xs font-medium text-grove-cream">
                          Conversation · {post.comment_count || 0}
                        </p>
                        <p className="font-latin text-xs text-grove-cream truncate max-w-2/3">
                          on {post.display_name || post.username}'s post
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        {(commentsData[post.id] || []).map(c => (
                          <div key={c.id} className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-grove-moss flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-ui font-medium text-grove-sprout">{(c.display_name || c.username || 'G')[0].toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs"><span className="font-medium text-grove-cream">{c.username}</span> <span className="text-grove-cream">{c.body}</span></p>
                              {c.photo_url && (
                                <button
                                  type="button"
                                  onClick={() => setLightboxSrc(getFileUrl(c.photo_url))}
                                  data-testid="feed-comment-photo"
                                  className="mt-1.5 block rounded-inset overflow-hidden border-hairline border-grove-moss w-32 h-32 cursor-zoom-in"
                                >
                                  <img src={getFileUrl(c.photo_url)} alt="Attached to this comment" className="w-full h-full object-cover" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <input aria-label="Write a comment"
                            type="text"
                            value={commentTexts[post.id] || ''}
                            onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                            placeholder="Write a comment…"
                            data-testid="feed-comment-input"
                            className="flex-1 bg-grove-forest border-hairline border-grove-moss rounded-inset px-3 py-1.5 text-xs font-ui placeholder:text-grove-sage focus:outline-none focus:ring-1 focus:ring-grove-lime"
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            data-testid="feed-comment-submit"
                            aria-label="Post comment"
                            className={cn(buttonVariants({ size: 'icon' }), "rounded-full")}
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
