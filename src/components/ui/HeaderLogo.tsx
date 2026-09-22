import React from 'react';
import { SpendTrackLogo } from '../TrackPayLogo.js';

interface HeaderLogoProps {
  onClick?: () => void;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer group select-none"
    >
      <SpendTrackLogo size="md" />
      <div className="flex flex-col">
        <span className="text-base font-black text-white tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
          SpendTrack <span className="text-emerald-400">AI</span>
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400/90 mt-0.5">
          Finance OS
        </span>
      </div>
    </div>
  );
};
