'use client';

import { useState } from 'react';
import { getGolferHeadshot } from '@/lib/espn';

interface GolferHeadshotProps {
  golferName: string;
  size?: 'sm' | 'md';
  espnHeadshot?: string; // Optional override from live ESPN data
}

export default function GolferHeadshot({ golferName, size = 'sm', espnHeadshot }: GolferHeadshotProps) {
  const [error, setError] = useState(false);
  const url = espnHeadshot || getGolferHeadshot(golferName);
  const dims = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  if (!url || error) {
    // Fallback: initials circle
    const initials = golferName
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        className={`${dims} rounded-full flex items-center justify-center flex-shrink-0`}
        style={{ background: 'var(--navy-800)', color: 'var(--gold-300)', fontSize: size === 'sm' ? '0.6rem' : '0.7rem', fontWeight: 600 }}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={golferName}
      className={`${dims} rounded-full object-cover flex-shrink-0 bg-gray-100`}
      onError={() => setError(true)}
    />
  );
}
