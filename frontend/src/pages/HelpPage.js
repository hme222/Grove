import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { GROVE_BRAND } from '@/constants/brand';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import PhotoGuideCards from '../components/PhotoGuideCards';

const TUTORIAL_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: "Add your first plant. You will be asked for a photo — it becomes the first entry in your plant's story. Set a watering schedule based on your grow medium (soil, leca, water). Grove tracks due dates automatically.",
  },
  {
    id: 'photo-guide',
    title: 'How to take a great plant photo',
    custom: true,
    content: 'Six short cards covering light, framing, background, angle, focus, and making it personal.',
  },
  {
    id: 'care-mode',
    title: 'Care Mode',
    content: "Only plants that need attention today appear in Care mode. They're sorted by urgency. Log care with one tap. At day 7, the social feed unlocks.",
  },
  {
    id: 'status-dots',
    title: 'Status Dots',
    content: 'Green = all good. Amber = water soon. Pink = overdue. Teal = propagating. Scan your whole collection in seconds without opening each plant.',
  },
  {
    id: 'bulk-water',
    title: 'Weekly Water Round',
    content: 'Log water for your whole collection in one tap. Monthly plants are automatically excluded when not yet due. Saves time on watering day.',
  },
  {
    id: 'streaks',
    title: 'Streaks & Unlocks',
    content: 'Log care every day to grow your streak. At day 7, the social feed unlocks. At day 30, swap matching unlocks. Streaks measure consistency, not over-attention.',
  },
  {
    id: 'bouquets',
    title: 'Track Bouquets',
    content: 'Photograph any arrangement. Grove identifies every flower using AI and builds a personalized care plan to extend its vase life. Track water changes and watch the timeline.',
  },
  {
    id: 'groves',
    title: 'Groves (Community Groups)',
    content: "A grove is never a single tree. Join or create groves to see what other members are growing, share updates, and swap cuttings. It's a quieter, more intentional feed.",
  },
  {
    id: 'mission',
    title: 'Our Mission',
    content: GROVE_BRAND.mission,
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-6" data-testid="help-page">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#F5F0E8] border-b-[0.5px] border-[#D3C9B8] px-4 py-3">
        <div className="flex items-center gap-3 max-w-[1100px] mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-[#1C2E10] hover:text-[#3B6D11] transition-colors"
            data-testid="help-back-button"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-plant text-xl text-[#1C2E10]">Help & Tutorial</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto px-4 pt-6 space-y-6">
        {/* Mission Statement */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-5">
          <h2 className="font-[Georgia] text-lg text-[#1C2E10] mb-2">{GROVE_BRAND.name}</h2>
          <p className="text-sm text-[#2B2B26] leading-relaxed mb-3">{GROVE_BRAND.mission}</p>
          <p className="text-xs text-[#2B2B26] italic">{GROVE_BRAND.closingLine}</p>
        </div>

        {/* Tutorial Accordion */}
        <Accordion type="single" collapsible className="space-y-2">
          {TUTORIAL_SECTIONS.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] px-4"
              data-testid={`help-section-${section.id}`}
            >
              <AccordionTrigger className="font-sans text-xs uppercase tracking-[0.12em] text-[#1C2E10] py-4 hover:no-underline">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[#2B2B26] pb-4 leading-relaxed">
                {section.custom && section.id === 'photo-guide' ? (
                  <div className="pt-2">
                    <p className="mb-3 text-xs text-[#2B2B26]">{section.content}</p>
                    <PhotoGuideCards />
                  </div>
                ) : (
                  section.content
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
