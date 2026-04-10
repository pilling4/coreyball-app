'use client';

import { useState, useEffect } from 'react';
import { Tournament, TournamentData, PlayerSeason } from '@/lib/types';
import { getSeedData, getAllTournamentData, getLiveTournaments } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase';
import { TOURNAMENTS } from '@/lib/constants';
import { buildPlayerSeasons } from '@/lib/utils';
import { TournamentProvider } from '@/lib/TournamentContext';
import Navigation from '@/components/Navigation';
import TournamentScoreboard from '@/components/TournamentScoreboard';
import GolferOwnership from '@/components/GolferOwnership';
import SeasonStandings from '@/components/SeasonStandings';
import SeasonEarnings from '@/components/SeasonEarnings';
import PlayerProfile from '@/components/PlayerProfile';
import GolferStats from '@/components/GolferStats';

type Tab = 'tournaments' | 'standings' | 'earnings' | 'golfers';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>(TOURNAMENTS);
  const [tournamentData, setTournamentData] = useState<Record<string, TournamentData>>({});
  const [playerSeasons, setPlayerSeasons] = useState<PlayerSeason[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      let data: Record<string, TournamentData> = {};

      try {
        if (isSupabaseConfigured()) {
          // Race against a timeout to prevent infinite loading
          const supabaseLoad = async () => {
            const liveTournaments = await getLiveTournaments();
            setTournaments(liveTournaments);
            const allData = await getAllTournamentData();
            for (const td of allData) {
              data[td.tournament.id] = td;
            }
          };
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Supabase timeout')), 8000)
          );
          await Promise.race([supabaseLoad(), timeout]);
        }
      } catch (err) {
        console.error('Failed to load from Supabase, using seed data:', err);
      }

      // Fall back to seed data if nothing loaded
      if (Object.keys(data).length === 0) {
        data = getSeedData();
      }

      setTournamentData(data);
      setPlayerSeasons(buildPlayerSeasons(Object.values(data)));
      setLoading(false);
    }
    loadData().catch(() => {
      setTournamentData(getSeedData());
      setPlayerSeasons(buildPlayerSeasons(Object.values(getSeedData())));
      setLoading(false);
    });
  }, []);

  const handlePlayerClick = (handle: string) => {
    setSelectedPlayer(handle);
  };

  const handleBack = () => {
    setSelectedPlayer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-2xl" style={{ color: 'var(--gold-500)' }}>{'\u{26F3}'}</p>
          <p className="text-sm text-gray-400 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Player Profile View
  if (selectedPlayer) {
    const player = playerSeasons.find(p => p.handle === selectedPlayer);
    if (player) {
      return (
        <TournamentProvider tournaments={tournaments}>
          <div className="min-h-screen bg-white">
            <Navigation activeTab={activeTab} onTabChange={t => { setSelectedPlayer(null); setActiveTab(t); }} />
            <main className="max-w-7xl mx-auto px-4 py-6">
              <PlayerProfile player={player} allTournamentData={tournamentData} onBack={handleBack} />
            </main>
          </div>
        </TournamentProvider>
      );
    }
  }

  return (
    <TournamentProvider tournaments={tournaments}>
      <div className="min-h-screen bg-white">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'tournaments' && (
            <div className="space-y-8">
              <TournamentScoreboard tournamentData={tournamentData} playerSeasons={playerSeasons} onPlayerClick={handlePlayerClick} />
              <div id="ownership-section" className="cb-card">
                <GolferOwnership tournamentData={tournamentData} />
              </div>
            </div>
          )}
          {activeTab === 'standings' && (
            <SeasonStandings
              playerSeasons={playerSeasons}
              tournamentData={tournamentData}
              onPlayerClick={handlePlayerClick}
            />
          )}
          {activeTab === 'earnings' && (
            <SeasonEarnings
              playerSeasons={playerSeasons}
              onPlayerClick={handlePlayerClick}
            />
          )}
          {activeTab === 'golfers' && (
            <GolferStats tournamentData={tournamentData} />
          )}
        </main>
      </div>
    </TournamentProvider>
  );
}
