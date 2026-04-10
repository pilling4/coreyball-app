'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setTimeout(() => setLogoLoaded(true), 200);
    setTimeout(() => setShowTitle(true), 1000);
    setTimeout(() => setShowButton(true), 1600);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900" />
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(191,167,106,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(191,167,106,0.2) 0%, transparent 50%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Logo */}
        <div className={`transition-all duration-1000 ease-out ${logoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="w-48 h-48 md:w-56 md:h-56 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Coreyball Golf"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Title */}
        <div className={`mt-8 text-center transition-all duration-700 ${showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-wide animate-shimmer"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            COREYBALL
          </h1>
          <p className="text-lg md:text-xl mt-2 tracking-widest uppercase"
            style={{ color: 'var(--gold-300)', letterSpacing: '0.25em' }}>
            Golf 2026
          </p>
          <div className="mt-3 w-32 h-px mx-auto" style={{ background: 'linear-gradient(90deg, transparent, var(--gold-500), transparent)' }} />
          <p className="mt-3 text-sm" style={{ color: 'var(--gold-600)' }}>
            DraftKings Season-Long DFS League
          </p>
        </div>

        {/* Hello Friends Button — no password, goes straight in */}
        <div className={`mt-12 transition-all duration-700 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-10 py-3.5 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{
              fontFamily: 'Georgia, serif',
              background: 'linear-gradient(135deg, #BFA76A, #D4C089, #A8935A)',
              color: 'var(--navy-900)',
              boxShadow: '0 4px 20px rgba(191, 167, 106, 0.3)',
            }}
          >
            Hello Friends
          </button>
        </div>
      </div>
    </div>
  );
}
