import React from 'react';
import SteamEffect from './SteamEffect';

const TeaCup: React.FC = () => {
  return (
    <div className="relative animate-float">
      <SteamEffect />
      <div className="relative">
        {/* Cup */}
        <div className="w-24 h-20 bg-gradient-to-b from-primary/90 to-primary rounded-b-[2rem] rounded-t-lg relative overflow-hidden shadow-xl">
          {/* Tea liquid */}
          <div className="absolute bottom-2 left-2 right-2 h-12 bg-tea-brown/80 rounded-b-[1.5rem] rounded-t-sm" />
          {/* Shine */}
          <div className="absolute top-2 left-3 w-4 h-6 bg-primary-foreground/20 rounded-full rotate-12" />
        </div>
        {/* Handle */}
        <div className="absolute right-[-12px] top-3 w-5 h-12 border-4 border-primary rounded-r-full" />
        {/* Saucer */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-3 bg-gradient-to-r from-muted via-card to-muted rounded-full shadow-md" />
      </div>
    </div>
  );
};

export default TeaCup;
