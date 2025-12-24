import React from 'react';

const SteamEffect: React.FC = () => {
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-2 h-8 bg-tea-steam/40 rounded-full animate-steam"
          style={{
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default SteamEffect;
