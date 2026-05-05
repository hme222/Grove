import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groveAPI, feedAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { getFileUrl } from '../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Users, Heart, MessageCircle, Send, Leaf, LogOut } from 'lucide-react';
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
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [groveRes, membersRes, feedRes] = await Promise.all([
        groveAPI.getOne(groveId),
        groveAPI.getMembers(groveId),
        groveAPI.getFeed(groveId),
      ]);
      setGrove(groveRes.data);
      setMembers(membersRes.data);
      setPosts(feedRes.data.posts || []);
    } catch (e) {
      toast.error('Failed to load grove');
      navigate('/groves');
    } finally {
      setLoading(false);
    }
  }, [groveId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLeave = async () => {
    if (window.confirm('Leave this grove?')) {
      try {
        await groveAPI.leave(groveId);
        toast.success('Left grove');
        navigate('/groves');
      } catch (e) {
        toast.error('Failed to leave');
      }
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
      toast.error('Failed to post');
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

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#5DCAA5] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-[#EDE5D8] border-b-[0.5px] border-[#D3C9B8] px-4 py-4">
        <div className="max-w-[600px] mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/groves')} className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-[#1C2E10]" />
            </button>
            <div className="flex-1">
              <h1 className="font-plant text-[#1C2E10] text-xl">{grove?.name}</h1>
              <p className="font-ui text-[10px] text-[#2B2B26]">{grove?.member_count} members</p>
            </div>
            {grove?.is_member && (
              <button
                onClick={handleLeave}
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#E24B4A] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white transition-colors duration-150 flex items-center gap-1"
              >
                <LogOut className="h-3 w-3" />
                Leave
              </button>
            )}
          </div>
          {grove?.description && (
            <p className="font-ui text-xs text-[#2B2B26]">{grove.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-[600px] mx-auto px-4 py-4">
        <Tabs defaultValue="feed">
          <TabsList className="bg-transparent border-b-[0.5px] border-[#D3C9B8] rounded-none w-full justify-start gap-1 h-auto p-0">
            <TabsTrigger value="feed" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#EAF3DE] data-[state=active]:text-[#1C2E10] text-xs font-ui px-4 py-2">Feed</TabsTrigger>
            <TabsTrigger value="chat" data-testid="grove-chat-tab" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#EAF3DE] data-[state=active]:text-[#1C2E10] text-xs font-ui px-4 py-2">Chat</TabsTrigger>
            <TabsTrigger value="members" className="rounded-t-[8px] rounded-b-none data-[state=active]:bg-[#EAF3DE] data-[state=active]:text-[#1C2E10] text-xs font-ui px-4 py-2">Members ({members.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="pt-4 space-y-4">
            {/* Compose in grove */}
            {grove?.is_member && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                  placeholder="Share with your grove..."
                  className="flex-1 bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-3 py-2.5 text-sm font-ui placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                />
                <button
                  onClick={handlePost}
                  disabled={posting || !caption.trim()}
                  className="rounded-full w-10 h-10 bg-[#5DCAA5] text-white flex items-center justify-center hover:bg-[#4ab08d] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-5 text-center">
                <p className="font-plant text-[#1C2E10]">No posts yet</p>
                <p className="font-ui text-xs text-[#2B2B26] mt-1">Be the first to share in this grove.</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#EAF3DE] flex items-center justify-center">
                      <span className="font-plant text-[#3B6D11] text-[10px]">{(post.display_name || 'G')[0].toUpperCase()}</span>
                    </div>
                    <span className="font-ui text-xs font-medium text-[#1C2E10] inline-flex items-center gap-1">
                      <span>{post.display_name || post.username}</span>
                      <VerifiedProBadge user={post} size={12} />
                    </span>
                    <span className="font-latin text-[9px] text-[#D3C9B8]">{formatTime(post.created_at)}</span>
                  </div>
                  {post.caption && <p className="font-ui text-sm text-[#1A1A17] mb-2">{post.caption}</p>}
                  <div className="flex items-center gap-3 pt-2 border-t-[0.5px] border-[#D3C9B8]/30">
                    <button onClick={() => handleKudos(post.id, post.user_gave_kudos)} className={`flex items-center gap-1 text-xs ${post.user_gave_kudos ? 'text-[#D4537E]' : 'text-[#2B2B26]'}`}>
                      <Heart className="h-3.5 w-3.5" fill={post.user_gave_kudos ? '#D4537E' : 'none'} />{post.kudos_count || 0}
                    </button>
                    <span className="flex items-center gap-1 text-xs text-[#2B2B26]"><MessageCircle className="h-3.5 w-3.5" />{post.comment_count || 0}</span>
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
              <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-5 text-center">
                <p className="font-plant text-[#1C2E10]">Members only</p>
                <p className="font-ui text-xs text-[#2B2B26] mt-1">
                  Join this Grove to read and post in the chat.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="pt-4 space-y-2">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[#EAF3DE] flex items-center justify-center">
                  <span className="font-plant text-[#3B6D11] text-sm">{(m.display_name || m.username || 'G')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-sm text-[#1C2E10] font-medium inline-flex items-center gap-1">
                    <span className="truncate">{m.display_name || m.username}</span>
                    <VerifiedProBadge user={m} size={14} />
                  </p>
                  <p className="font-latin text-[9px] text-[#2B2B26]">@{m.username}</p>
                </div>
                {m.role === 'admin' && (
                  <span className="rounded-[20px] border-[0.5px] border-[#5DCAA5] bg-[#EAF3DE] px-2 py-0.5 text-[9px] font-ui text-[#5DCAA5]">Admin</span>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
