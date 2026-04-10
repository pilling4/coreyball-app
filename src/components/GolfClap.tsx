'use client';

import { useEffect, useState } from 'react';

interface GolfClapProps {
  playerName: string;
  tournamentName: string;
  onClose: () => void;
}

export default function GolfClap({ playerName, tournamentName, onClose }: GolfClapProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`golf-clap-toast transition-all duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
    >
      <div className="animate-golfClap text-6xl mb-4">
        {'\u{1F44F}'}
      </div>
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gold-500)' }}>
        A respectful golf clap for
      </p>
      <p className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-400)' }}>
        {playerName}
      </p>
      <p className="text-sm text-gray-400">
        {tournamentName} Champion
      </p>
      <div className="mt-4 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <span
            key={i}
            className="text-2xl animate-golfClap"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {'\u{1F44F}'}
          </span>
        ))}
      </div>
    </div>
  );
}
