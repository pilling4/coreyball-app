'use client';

import { PlayerSeason, TournamentData } from '@/lib/types';
import { calculateAdjustedPoints } from '@/lib/utils';
import { useTournaments } from '@/lib/TournamentContext';

interface LeaderboardScoreboardProps {
  playerSeasons: PlayerSeason[];
  tournamentData: Record<string, TournamentData>;
  onPlayerClick: (handle: string) => void;
}

export default function LeaderboardScoreboard({ playerSeasons, tournamentData, onPlayerClick }: LeaderboardScoreboardProps) {
  const TOURNAMENTS = useTournaments();

  const completedIds = new Set(TOURNAMENTS.filter(t => t.status === 'completed').map(t => t.id));
  const inProgressIds = new Set(TOURNAMENTS.filter(t => t.status === 'in_progress').map(t => t.id));

  // Calculate standings
  const standings = playerSeasons.map(p => {
    let totalPts = 0;
    for (const t of p.tournaments) {
      if (t.lineup.length === 0) continue;
      if (completedIds.has(t.tournamentId) || inProgressIds.has(t.tournamentId)) {
        totalPts += calculateAdjustedPoints(t.points, t.multiplier);
      }
    }
    return { handle: p.handle, totalPts, seasonRank: 0 };
  }).sort((a, b) => b.totalPts - a.totalPts);

  // Assign ranks
  standings.forEach((s, i) => { s.seasonRank = i + 1; });

  const leaderPts = standings[0]?.totalPts || 0;

  // Show top 15 on the board, or all if fewer
  const displayCount = Math.min(standings.length, 15);
  const displayed = standings.slice(0, displayCount);

  // Determine tier breaks for visual grouping (top 3, 4-10, rest)
  const getTierClass = (rank: number): string => {
    if (rank <= 3) return 'sb-tier-top';
    if (rank <= 10) return 'sb-tier-mid';
    return 'sb-tier-rest';
  };

  return (
    <div className="sb-wrapper">
      {/* Header */}
      <div className="sb-header">
        <span className="sb-header-text">LEADERS</span>
      </div>

      {/* Scoreboard grid */}
      <div className="sb-board">
        <table className="sb-table">
          <thead>
            <tr>
              <th className="sb-col-rank">RK</th>
              <th className="sb-col-player">PLAYER</th>
              <th className="sb-col-total">TOTAL</th>
              <th className="sb-col-back">BACK</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((player, i) => {
              const showTierBreak = i > 0 && getTierClass(player.seasonRank) !== getTierClass(displayed[i - 1].seasonRank);
              const pointsBack = player.seasonRank === 1 ? 0 : leaderPts - player.totalPts;
              return (
                <tr
                  key={player.handle}
                  className={`sb-row ${getTierClass(player.seasonRank)} ${showTierBreak ? 'sb-tier-break' : ''}`}
                >
                  <td className="sb-col-rank sb-cell">
                    {player.seasonRank}
                  </td>
                  <td className="sb-col-player sb-cell">
                    <button
                      onClick={() => onPlayerClick(player.handle)}
                      className="sb-player-name"
                    >
                      {player.handle.toUpperCase()}
                    </button>
                  </td>
                  <td className="sb-col-total sb-cell sb-total">
                    {player.totalPts > 0 ? player.totalPts.toFixed(1) : '\u2014'}
                  </td>
                  <td className="sb-col-back sb-cell" style={{ color: player.seasonRank === 1 ? 'var(--gold-600)' : 'var(--gray-500)' }}>
                    {player.seasonRank === 1 ? '\u2014' : `-${pointsBack.toFixed(1)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
