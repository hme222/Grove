import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusDot } from './StatusDot';
import { getFileUrl } from '../lib/api';
import { Leaf } from 'lucide-react';

export default function PlantCard({ plant, selected, onSelect, selectionMode }) {
  const navigate = useNavigate();
  const photoUrl = getFileUrl(plant.photo_url);

  const handleClick = () => {
    if (selectionMode && onSelect) {
      onSelect(plant.id);
    } else {
      navigate(`/plants/${plant.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      data-testid="collection-grid-plant-tile"
      className={`relative rounded-[14px] border-[0.5px] border-grove-moss overflow-hidden aspect-square w-full text-left transition-colors duration-150 hover:border-grove-fernLine ${
        selected ? 'ring-2 ring-grove-lime' : ''
      }`}
    >
      {photoUrl ? (
        <div className="w-full h-full bg-grove-moss flex items-center justify-center">
          <img
            src={photoUrl}
            // The card already prints the name. Only describe the photo when the printed name is a nickname.
            alt={plant.nickname && plant.nickname !== plant.common_name ? plant.common_name : ''}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.nextSibling.style.display = 'flex'; }}
          />
        </div>
      ) : null}
      <div
        className={`absolute inset-0 bg-grove-moss flex items-center justify-center ${photoUrl ? 'hidden' : 'flex'}`}
      >
        <Leaf className="h-8 w-8 text-grove-sprout opacity-40" />
      </div>
      
      {/* Status dot */}
      <div className="absolute top-2 left-2">
        <StatusDot status={plant.status || 'healthy'} />
      </div>
      
      {/* Selection check */}
      {selectionMode && selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-grove-lime flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#1A2410" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
      
      {/* Name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-grove-night/90 via-grove-night/60 to-transparent px-2.5 pb-2 pt-6">
        <p className="font-plant text-grove-cream text-sm truncate">
          {plant.nickname || plant.common_name}
        </p>
        {plant.latin_name && (
          <p className="font-latin text-grove-sage text-xs truncate">
            {plant.latin_name}
          </p>
        )}
      </div>
    </button>
  );
}
