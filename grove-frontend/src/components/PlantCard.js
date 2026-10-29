import React from 'react';
import { AppLink } from './AppLink';
import { StatusDot } from './StatusDot';
import { getFileUrl } from '../lib/api';
import { Leaf, Droplet } from 'lucide-react';
import PhotoBand from './PhotoBand';
import { wateredToday } from '../lib/careActions';

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
      
      {/* Status dot */}
      <div className="absolute top-2 left-2">
        <StatusDot status={plant.status || 'healthy'} showLabel={(plant.status || 'healthy') !== 'healthy'} className="rounded-pill bg-grove-night/80 py-0.5 pl-1 pr-2" />
      </div>
      
      {/* Selection check */}
      {selectionMode && selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-pill bg-grove-lime flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="var(--grove-root)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
      
      {/* Name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-grove-night/95 via-grove-night/80 to-transparent px-2.5 pb-2 pt-10">
        <p className="font-plant text-base text-grove-cream truncate">
          {plant.nickname || plant.common_name}
        </p>
        {wateredToday(plant) && (
          <p className="flex items-center gap-1 font-ui text-xs text-grove-cream" data-testid="plant-card-cared-today">
            <Droplet className="h-3 w-3 text-grove-lime" aria-hidden="true" />
            Watered today
          </p>
        )}
        {plant.latin_name && (
          <p className="font-latin text-grove-sage text-xs truncate">
            {plant.latin_name}
          </p>
        )}
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
