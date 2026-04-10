'use client';

import { useState } from 'react';
import { PlayerSeason, TournamentData } from '@/lib/types';
import { calculateAdjustedPoints } from '@/lib/utils';
import { useTournaments } from '@/lib/TournamentContext';
import PayoutModal from './PayoutModal';
import LeaderboardScoreboard from './LeaderboardScoreboard';

interface SeasonStandingsProps {
  playerSeasons: PlayerSeason[];
  tournamentData: Record<string, TournamentData>;
  onPlayerClick: (handle: string) => void;
}

export default function SeasonStandings({ playerSeasons, tournamentData, onPlayerClick }: SeasonStandingsProps) {
  const TOURNAMENTS = useTournaments();
  const [showPayouts, setShowPayouts] = useState(false);

  const activeTournaments = TOURNAMENTS.filter(t => tournamentData[t.id]);
  const completedTournamentIds = new Set(
    TOURNAMENTS.filter(t => t.status === 'completed').map(t => t.id)
  );
  const inProgressTournamentIds = new Set(
    TOURNAMENTS.filter(t => t.status === 'in_progress').map(t => t.id)
  );

  // Total Points = completed tournaments (with multiplier) + in-progress tournaments (with multiplier)
  const standingsData = playerSeasons.map(p => {
    let totalPts = 0;
    for (const t of p.tournaments) {
      if (t.lineup.length === 0) continue;
      if (completedTournamentIds.has(t.tournamentId) || inProgressTournamentIds.has(t.tournamentId)) {
        totalPts += calculateAdjustedPoints(t.points, t.multiplier);
      }
    }
    return { ...p, calculatedTotal: totalPts };
  }).sort((a, b) => b.calculatedTotal - a.calculatedTotal);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--navy-800)' }}>
          Season Standings
        </h2>
        <button
          onClick={() => setShowPayouts(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 cursor-pointer"
          style={{
            background: 'rgba(168, 144, 88, 0.1)',
            color: 'var(--gold-600)',
            border: '1px solid rgba(168, 144, 88, 0.25)',
          }}
          title="View payout structure"
        >
          {'\u{1F4B0}'} Payouts
        </button>
      </div>

      {/* Golf Scoreboard Hero */}
      <LeaderboardScoreboard
        playerSeasons={playerSeasons}
        tournamentData={tournamentData}
        onPlayerClick={onPlayerClick}
      />

      {/* Full Standings Table */}
      <h3 className="text-sm font-semibold mb-3 mt-2" style={{ color: 'var(--navy-700)' }}>Full Standings</h3>
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--gray-200)' }}>
        <table className="cb-table">
          <thead>
            <tr>
              <th className="w-14">Rank</th>
              <th>Player</th>
              <th>Total Pts</th>
              {activeTournaments.map(t => (
                <th key={t.id} title={t.name}>
                  <span>{t.shortName}</span>
                  {t.isMajor && <span className="text-xs ml-0.5 opacity-50">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standingsData.map((player, i) => {
              const rankEmoji = i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : null;
              return (
                <tr key={player.handle}>
                  <td className="cb-data text-sm">
                    {rankEmoji ? (
                      <span className="text-base">{rankEmoji}</span>
                    ) : (
                      <span style={{ color: 'var(--gray-500)' }}>{i + 1}</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => onPlayerClick(player.handle)}
                      className="player-link"
                    >
                      {player.handle}
                    </button>
                  </td>
                  <td className="cb-data text-sm font-semibold" style={{ color: 'var(--navy-800)' }}>
                    {player.calculatedTotal > 0 ? player.calculatedTotal.toFixed(1) : '\u2014'}
                  </td>
                  {activeTournaments.map(t => {
                    const pt = player.tournaments.find(pt => pt.tournamentId === t.id);
                    const isCompleted = completedTournamentIds.has(t.id);
                    const isIP = inProgressTournamentIds.has(t.id);

                    if (!pt || pt.lineup.length === 0) {
                      return (
                        <td key={t.id}>
                          <span className="badge badge-dns text-xs">DNS</span>
                        </td>
                      );
                    }

                    const adjustedPts = calculateAdjustedPoints(pt.points, pt.multiplier);

                    if (isIP) {
                      return (
                        <td key={t.id} className="cb-data text-xs" style={{ color: 'var(--gray-500)' }} title={`In Progress - Raw: ${pt.points} pts${pt.multiplier > 1 ? ` x ${pt.multiplier}` : ''}`}>
                          {adjustedPts.toFixed(1)}
                        </td>
                      );
                    }

                    if (isCompleted) {
                      return (
                        <td key={t.id} className="cb-data text-xs" title={`Raw: ${pt.points} pts`}>
                          {adjustedPts.toFixed(1)}
                        </td>
                      );
                    }

                    return (
                      <td key={t.id} className="cb-data text-xs" style={{ color: 'var(--gray-400)' }}>
                        {adjustedPts.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-400">* Major tournaments scored at 1.25x multiplier</p>

      <PayoutModal isOpen={showPayouts} onClose={() => setShowPayouts(false)} />
    </div>
  );
}
