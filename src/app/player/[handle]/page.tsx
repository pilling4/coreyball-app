'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TournamentData, PlayerSeason } from '@/lib/types';
import { getSeedData } from '@/lib/data';
import { buildPlayerSeasons } from '@/lib/utils';
import Navigation from '@/components/Navigation';
import PlayerProfile from '@/components/PlayerProfile';

export default function PlayerPage() {
  const router = useRouter();
  const params = useParams();
  const handle = decodeURIComponent(params.handle as string);
  const [tournamentData, setTournamentData] = useState<Record<string, TournamentData>>({});
  const [player, setPlayer] = useState<PlayerSeason | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authed = localStorage.getItem('cb-auth');
    if (authed !== 'true') {
      router.push('/');
      return;
    }

    const seed = getSeedData();
    setTournamentData(seed);
    const allData = Object.values(seed);
    const seasons = buildPlayerSeasons(allData);
    const found = seasons.find(p => p.handle === handle);
    setPlayer(found || null);
    setLoading(false);
  }, [router, handle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-4xl">{'\u{26F3}'}</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Player not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 rounded text-sm cursor-pointer"
            style={{ background: 'var(--gold-500)', color: 'var(--navy-900)' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation activeTab="tournaments" onTabChange={() => router.push('/dashboard')} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <PlayerProfile
          player={player}
          allTournamentData={tournamentData}
          onBack={() => router.push('/dashboard')}
        />
      </main>
    </div>
  );
}
