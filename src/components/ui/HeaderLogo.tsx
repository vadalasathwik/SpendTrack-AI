import React from 'react';
import { TrackPayLogo } from '../TrackPayLogo.js';

interface HeaderLogoProps {
  onClick?: () => void;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer group select-none"
    >
      <TrackPayLogo size="md" />
      <div className="flex flex-col">
        <span className="text-base font-black text-white tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
          TrackPay
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 mt-0.5">
          Finance OS
        </span>
      </div>
    </div>
  );
};
