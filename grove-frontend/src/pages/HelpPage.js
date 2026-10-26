import React from 'react';
import { PageHeader } from '../components/PageHeader';
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
    title: 'Getting started',
    content: "Add your first plant. You will be asked for a photo — it becomes the first entry in your plant's story. Set a watering schedule based on your grow medium (soil, leca, water). FloraGrove tracks due dates automatically.",
  },
  {
    id: 'photo-guide',
    title: 'How to take a great plant photo',
    custom: true,
    content: 'Six short cards covering light, framing, background, angle, focus, and making it personal.',
  },
  {
    id: 'today',
    title: 'Today',
    content: "The Today tab lists plants that are due or overdue for water, most overdue first. Log care with one tap. Plants that are not due stay out of the way.",
  },
  {
    id: 'status-marks',
    title: 'Status marks',
    content: 'Each plant has a colour and a symbol. A check mark means all good. A drop means water soon. An exclamation mark means it needs a check. Waves mean it is propagating. You can scan your collection without opening each plant.',
  },
  {
    id: 'bulk-water',
    title: 'Water all',
    content: 'Water all logs water for every plant on your Today list, after you confirm. Plants that are not due are left out. You can undo it right after.',
  },
  {
    id: 'reminders',
    title: 'Reminders',
    content: 'FloraGrove sends at most one reminder a day, and only when plants need a check. You can turn it off or change it in Profile, under Notifications.',
  },
  {
    id: 'bouquets',
    title: 'Track bouquets',
    content: 'Photograph any arrangement. FloraGrove identifies every flower using AI and builds a personalized care plan to extend its vase life. Track water changes and watch the timeline.',
  },
  {
    id: 'groves',
    title: 'Groves (community groups)',
    content: "A grove is never a single tree. Join or create groves to see what other members are growing, share updates, and swap cuttings. It's a quieter, more intentional feed.",
  },
  {
    id: 'mission',
    title: 'Our mission',
    content: GROVE_BRAND.mission,
  },
];

export default function HelpPage() {

  return (
    <div className="min-h-screen bg-grove-forest pb-6" data-testid="help-page">
      {/* Header */}
      <PageHeader title="Help &amp; Tutorial" back={{ testId: 'help-back-button' }} />

      {/* Content */}
      <div className="max-w-page mx-auto px-4 pt-6 space-y-6">
        {/* Mission Statement */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
          <h2 className="font-plant text-base font-semibold text-grove-cream mb-2">{GROVE_BRAND.name}</h2>
          <p className="text-sm text-grove-cream leading-relaxed mb-3">{GROVE_BRAND.mission}</p>
          <p className="text-xs text-grove-cream italic">{GROVE_BRAND.closingLine}</p>
        </div>

        {/* Tutorial Accordion */}
        <Accordion type="single" collapsible className="space-y-2">
          {TUTORIAL_SECTIONS.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="rounded-small border-hairline border-grove-moss bg-grove-moss px-4"
              data-testid={`help-section-${section.id}`}
            >
              <AccordionTrigger className="font-plant text-base font-semibold text-grove-cream py-4 hover:no-underline">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-grove-cream pb-4 leading-relaxed">
                {section.custom && section.id === 'photo-guide' ? (
                  <div className="pt-2">
                    <p className="mb-3 text-xs text-grove-cream">{section.content}</p>
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
