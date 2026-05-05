import React from 'react';
import {
  Flame, Droplets, Sparkles, FlowerIcon, Flower2, Scissors,
  CloudRain, Sprout, Leaf, Trees, Heart, Award,
  ShieldCheck, Repeat, Calendar, BookOpen, GraduationCap,
  Sun, Snowflake, Globe, Users, MessageSquare, MessageCircle,
  UserPlus, Image, HandHeart, Apple, Gem, MapPin, Home,
  HeartPulse, CheckCircle, SearchCheck, Bug, FileText, QrCode,
  TrendingUp, Cloud, Map, Award as AwardIcon, RotateCcw,
  Crown,
} from 'lucide-react';

// Map our catalog `icon` strings to lucide-react components.
const ICON_MAP = {
  'flame': Flame,
  'droplets': Droplets,
  'sparkles': Sparkles,
  'flower': FlowerIcon,
  'flower-2': Flower2,
  'scissors': Scissors,
  'cloud-rain': CloudRain,
  'sprout': Sprout,
  'leaf': Leaf,
  'trees': Trees,
  'heart': Heart,
  'award': Award,
  'shield-check': ShieldCheck,
  'repeat': Repeat,
  'calendar': Calendar,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'sun': Sun,
  'snowflake': Snowflake,
  'globe': Globe,
  'users': Users,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  'user-plus': UserPlus,
  'image': Image,
  'hand-heart': HandHeart,
  'apple': Apple,
  'gem': Gem,
  'map-pin': MapPin,
  'map': Map,
  'home': Home,
  'heart-pulse': HeartPulse,
  'check-circle': CheckCircle,
  'search-check': SearchCheck,
  'bug': Bug,
  'file-text': FileText,
  'qr-code': QrCode,
  'trending-up': TrendingUp,
  'cloud': Cloud,
  'rotate-ccw': RotateCcw,
  'palm-tree': Trees, // lucide doesn't ship palm-tree; use trees
  'crown': Crown,
};

export function BadgeIcon({ name, ...rest }) {
  const Cmp = ICON_MAP[name] || AwardIcon;
  return <Cmp {...rest} />;
}
