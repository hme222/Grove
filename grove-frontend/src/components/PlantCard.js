import React from 'react';
import { AppLink } from './AppLink';
import { StatusDot } from './StatusDot';
import { getFileUrl } from '../lib/api';
import { Leaf, Droplet } from 'lucide-react';
import PhotoBand from './PhotoBand';
import { wateredToday, displayStatus } from '../lib/careActions';

export default function PlantCard({ plant, selected, onSelect, selectionMode }) {
  const photoUrl = getFileUrl(plant.photo_url);

  const selecting = Boolean(selectionMode && onSelect);
  const tileClass = `relative rounded-chip border-hairline border-grove-moss overflow-hidden aspect-square w-full text-left transition-colors duration-150 hover:border-grove-fernLine ${
        selected ? 'ring-2 ring-grove-lime' : ''
      }`;
  const content = (
    <>
      {photoUrl ? (
        <PhotoBand
          src={photoUrl}
          // The card already prints the name. Only describe the photo when the printed name is a nickname.
          alt={plant.nickname && plant.nickname !== plant.common_name ? plant.common_name : ''}
          aspect="square"
          className="rounded-none"
          testId="plant-card-photo"
        />
      ) : null}
      <div
        className={`absolute inset-0 bg-grove-moss flex items-center justify-center ${photoUrl ? 'hidden' : 'flex'}`}
      >
        <Leaf className="h-8 w-8 text-grove-sprout opacity-40" />
      </div>
      
      {/* Selection check */}
      {selectionMode && selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-pill bg-grove-lime flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="var(--grove-root)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
      
      {/* Name block: a bottom fade, then a column that holds the status at the top and the name at the bottom,
          so on a small photoless tile the two can never sit on top of each other. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-grove-night/95 via-grove-night/80 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 flex min-h-0 flex-col justify-between gap-1 p-2">
        <div className="flex min-w-0 justify-start">
          <StatusDot status={displayStatus(plant)} showLabel={displayStatus(plant) !== 'healthy'} className="rounded-pill bg-grove-night/80 py-0.5 pl-1 pr-2" />
        </div>
        <div className="min-w-0 px-0.5">
          <p className="font-plant text-base leading-tight text-grove-cream truncate">
            {plant.nickname || plant.common_name}
          </p>
          {/* One quiet line under the name: today's watering if there was one, else the Latin name. */}
          {wateredToday(plant) ? (
            <p className="flex items-start gap-1 font-ui text-xs leading-tight text-grove-cream" data-testid="plant-card-cared-today">
              <Droplet className="mt-0.5 h-3 w-3 shrink-0 text-grove-lime" aria-hidden="true" />
              <span>Watered today</span>
            </p>
          ) : plant.latin_name && (
            <p className="font-latin text-grove-sage text-xs truncate">
              {plant.latin_name}
            </p>
          )}
        </div>
      </div>
    </>
  );

  // Opening a plant is navigation (a link); picking one in selection mode is an action (a button).
  return selecting ? (
    <button type="button" onClick={() => onSelect(plant.id)} data-testid="collection-grid-plant-tile" className={tileClass}>{content}</button>
  ) : (
    <AppLink to={`/plants/${plant.id}`} state={{ name: plant.nickname || plant.common_name }} data-testid="collection-grid-plant-tile" className={`block ${tileClass}`}>{content}</AppLink>
  );
}
