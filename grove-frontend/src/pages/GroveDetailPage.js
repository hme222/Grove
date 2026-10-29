import { LoadErrorPage } from '../components/LoadError';
import { actionErrorMessage } from '../lib/errors';
import Loading from '../components/Loading';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import NotFoundPage from './NotFoundPage';
import BackButton from '../components/BackButton';
import { useParams, useNavigate } from 'react-router-dom';
import { groveAPI, feedAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Heart, MessageCircle, Send, LogOut } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GroveChat from '../components/GroveChat';
import VerifiedProBadge from '../components/VerifiedProBadge';

export default function GroveDetailPage() {
  const { groveId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grove, setGrove] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  const [notFound, setNotFound] = useState(false);
  const fetchData = useCallback(async () => {
    try {
      setLoadError(false);
      const [groveRes, membersRes, feedRes] = await Promise.all([
        groveAPI.getOne(groveId),
        groveAPI.getMembers(groveId),
        groveAPI.getFeed(groveId),
      ]);
      setGrove(groveRes.data);
      setMembers(membersRes.data);
      setPosts(feedRes.data.posts || []);
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
      else setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [groveId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const handleJoin = async () => {
    setJoining(true);
    setJoinError('');
    try {
      await groveAPI.join(groveId);
      toast.success('Joined grove');
      fetchData();
    } catch (e) {
      setJoinError(e.response?.data?.detail || 'We couldn’t join that grove. Check your connection and try again.');
    } finally {
      setJoining(false);
    }
  };

  const [leaveOpen, setLeaveOpen] = useState(false);
  const handleLeave = async () => {
    try {
      await groveAPI.leave(groveId);
      toast.success('You left the grove');
      navigate('/groves');
    } catch (e) {
      toast.error("Couldn’t leave the grove. Check your connection and try again.");
    }
  };

  const handlePost = async () => {
    if (!caption.trim()) return;
    setPosting(true);
    try {
      await feedAPI.createPost({ post_type: 'plant_update', caption });
      toast.success('Posted!');
      setCaption('');
      fetchData();
    } catch (e) {
      toast.error(actionErrorMessage(e, 'post that'));
    } finally {
      setPosting(false);
    }
  };

  const handleKudos = async (postId, hasKudos) => {
    try {
      if (hasKudos) await feedAPI.removeKudos(postId);
      else await feedAPI.addKudos(postId);
      fetchData();
    } catch (e) { /* ignore */ }
  };

  const formatTime = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (notFound) return <NotFoundPage />;
  if (loadError) {
    return <LoadErrorPage back title="Grove" onRetry={fetchData} />;
  }
  if (loading) {
    return <Loading label="Loading this grove" />;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-grove-moss border-b-hairline border-grove-moss px-4 py-4">
        <div className="max-w-column mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <BackButton to="/groves" where="groves" />
            <div className="min-w-0 flex-1">
              <h1 className="font-plant text-grove-cream text-xl [overflow-wrap:anywhere]">{grove?.name}</h1>
              <p className="font-ui text-xs text-grove-cream">{grove?.member_count} {grove?.member_count === 1 ? 'member' : 'members'}</p>
            </div>
            {grove?.is_member && (
              <button
                onClick={() => setLeaveOpen(true)}
                className="rounded-control font-ui text-xs px-3 py-2 border-hairline border-grove-moss text-grove-blush hover:bg-grove-sprout hover:text-grove-cream transition-colors duration-150 flex shrink-0 items-center gap-1"
              >
                <LogOut className="h-3 w-3" />
                Leave
              </button>
            )}
          </div>
          {grove?.description && (
            <p className="font-ui text-sm text-grove-cream" data-testid="grove-description">{grove.description}</p>
          )}
          {grove && !grove.is_member && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                aria-label={`Join ${grove.name}`}
                className={buttonVariants()}
                data-testid="grove-detail-join"
              >
                {joining ? 'Joining…' : 'Join'}
              </button>
              {joinError && <p role="alert" className="mt-2 font-ui text-sm text-destructive" data-testid="grove-detail-join-error">{joinError}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-column mx-auto px-4 py-4">
        <Tabs defaultValue="feed">
          <TabsList className="border-b-hairline border-grove-moss">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="chat" data-testid="grove-chat-tab">Chat</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="pt-4 space-y-4">
            {/* Compose in grove */}
            {grove?.is_member && (
              <div className="flex gap-2">
                <input aria-label="Share with your grove"
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                  placeholder="Share with your grove…"
                  className="flex-1 bg-grove-forest border-hairline border-grove-moss rounded-inset px-3 py-2.5 text-sm font-ui placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                />
                <button aria-label="Post to grove"
                  onClick={handlePost}
                  disabled={posting || !caption.trim()}
                  className={cn(buttonVariants({ size: 'icon' }), "rounded-pill")}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-center">
                <p className="font-plant text-grove-cream">No posts yet</p>
                <p className="font-ui text-xs text-grove-cream mt-1">Be the first to share in this grove.</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-pill bg-grove-moss flex items-center justify-center">
                      <span className="font-ui text-grove-sprout text-xs font-medium">{(post.display_name || 'G')[0].toUpperCase()}</span>
                    </div>
                    <span className="font-ui text-xs font-medium text-grove-cream inline-flex items-center gap-1">
                      <span>{post.display_name || post.username}</span>
                      <VerifiedProBadge user={post} size={12} />
                    </span>
                    <span className="font-latin text-xs text-grove-sage">{formatTime(post.created_at)}</span>
                  </div>
                  {post.caption && <p className="font-ui text-sm text-grove-cream mb-2">{post.caption}</p>}
                  <div className="flex items-center gap-3 pt-2 border-t-hairline border-grove-moss/25">
                    <button onClick={() => handleKudos(post.id, post.user_gave_kudos)} className={`flex items-center gap-1 text-xs ${post.user_gave_kudos ? 'text-grove-blush' : 'text-grove-cream'}`}>
                      <Heart className="h-3.5 w-3.5" fill={post.user_gave_kudos ? 'var(--grove-bloom)' : 'none'} />{post.kudos_count || 0}
                    </button>
                    <span className="flex items-center gap-1 text-xs text-grove-cream"><MessageCircle className="h-3.5 w-3.5" />{post.comment_count || 0}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="chat" className="pt-4">
            {grove?.is_member ? (
              <GroveChat
                groveId={groveId}
                currentUser={user}
                isAdmin={grove?.user_role === 'admin' || grove?.user_role === 'owner'}
                isSiteAdmin={!!user?.is_admin}
              />
            ) : (
              <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-center">
                <p className="font-plant text-grove-cream">Members only</p>
                <p className="font-ui text-xs text-grove-cream mt-1">
                  Join this grove to read and post in the chat.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="pt-4 space-y-2">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-small border-hairline border-grove-moss bg-grove-moss px-4 py-3">
                <div className="w-9 h-9 rounded-pill bg-grove-moss flex items-center justify-center">
                  <span className="font-ui text-grove-sprout text-sm font-medium">{(m.display_name || m.username || 'G')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-sm text-grove-cream font-medium inline-flex items-center gap-1">
                    <span className="truncate">{m.display_name || m.username}</span>
                    <VerifiedProBadge user={m} size={14} />
                  </p>
                  <p className="font-latin text-xs text-grove-cream">@{m.username}</p>
                </div>
                {m.role === 'admin' && (
                  <span className="inline-flex items-center rounded-pill border-hairline border-grove-lime bg-grove-moss px-2.5 py-1 text-xs font-ui text-grove-sprout min-h-6">Admin</span>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent data-testid="leave-grove-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {grove?.name || 'this grove'}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will stop seeing its posts. Your own posts stay in the grove. You can join again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="default">Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} className="border-strong border-grove-fernLine bg-transparent text-grove-cream hover:bg-grove-moss">Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
