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
      className={`relative rounded-[14px] border-[0.5px] border-[#D3C9B8] overflow-hidden aspect-square w-full text-left transition-colors duration-150 hover:border-[#2D5016] ${
        selected ? 'ring-2 ring-[#5DCAA5]' : ''
      }`}
    >
      {photoUrl ? (
        <div className="w-full h-full bg-[#EAF3DE] flex items-center justify-center">
          <img
            src={photoUrl}
            alt={plant.common_name}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.nextSibling.style.display = 'flex'; }}
          />
        </div>
      ) : null}
      <div
        className={`absolute inset-0 bg-[#EAF3DE] flex items-center justify-center ${photoUrl ? 'hidden' : 'flex'}`}
      >
        <Leaf className="h-8 w-8 text-[#3B6D11] opacity-40" />
      </div>
      
      {/* Status dot */}
      <div className="absolute top-2 left-2">
        <StatusDot status={plant.status || 'healthy'} />
      </div>
      
      {/* Selection check */}
      {selectionMode && selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#5DCAA5] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
      
      {/* Name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#1C2E10]/70 px-2 py-1.5">
        <p className="font-plant text-[#F5F0E8] text-xs truncate">
          {plant.nickname || plant.common_name}
        </p>
        {plant.latin_name && (
          <p className="font-latin text-[#9FE1CB] text-[9px] truncate">
            {plant.latin_name}
          </p>
        )}
      </div>
    </button>
  );
}
