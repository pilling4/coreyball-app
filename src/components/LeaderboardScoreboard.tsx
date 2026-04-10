'use client';

import { PlayerSeason, TournamentData } from '@/lib/types';
import { calculateAdjustedPoints } from '@/lib/utils';
import { useTournaments } from '@/lib/TournamentContext';

interface LeaderboardScoreboardProps {
  playerSeasons: PlayerSeason[];
  tournamentData: Record<string, TournamentData>;
  onPlayerClick: (handle: string) => void;
}

// Short labels for the scoreboard columns
const SCOREBOARD_LABELS: Record<string, string> = {
  'Masters': 'MAS',
  'Heritage': 'RBC',
  'Truist': 'TRU',
  'PGA': 'PGA',
  'Schwab': 'CSC',
  'Canadian': 'CAN',
  'US Open': 'USO',
  'Travelers': 'TRV',
  'Scottish': 'SCO',
  'The Open': 'OPN',
};

export default function LeaderboardScoreboard({ playerSeasons, tournamentData, onPlayerClick }: LeaderboardScoreboardProps) {
  const TOURNAMENTS = useTournaments();

  const completedIds = new Set(TOURNAMENTS.filter(t => t.status === 'completed').map(t => t.id));
  const inProgressIds = new Set(TOURNAMENTS.filter(t => t.status === 'in_progress').map(t => t.id));

  // Calculate standings
  const standings = playerSeasons.map(p => {
    let totalPts = 0;
    const tournamentPts: Record<string, number> = {};
    for (const t of p.tournaments) {
      if (t.lineup.length === 0) continue;
      if (completedIds.has(t.tournamentId) || inProgressIds.has(t.tournamentId)) {
        const adj = calculateAdjustedPoints(t.points, t.multiplier);
        totalPts += adj;
        tournamentPts[t.tournamentId] = adj;
      }
    }
    return { handle: p.handle, totalPts, tournamentPts, seasonRank: 0 };
  }).sort((a, b) => b.totalPts - a.totalPts);

  // Assign ranks
  standings.forEach((s, i) => { s.seasonRank = i + 1; });

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
        <div className="overflow-x-auto">
          <table className="sb-table">
            <thead>
              <tr>
                <th className="sb-col-rank">RK</th>
                <th className="sb-col-player">PLAYER</th>
                <th className="sb-col-total">TOT</th>
                {TOURNAMENTS.map(t => {
                  const label = SCOREBOARD_LABELS[t.shortName] || t.shortName.slice(0, 3).toUpperCase();
                  const hasData = !!tournamentData[t.id];
                  return (
                    <th
                      key={t.id}
                      className={`sb-col-tourney ${!hasData ? 'sb-col-upcoming' : ''}`}
                      title={t.name}
                    >
                      {label}
                      {t.isMajor && <span className="sb-major-dot" />}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayed.map((player, i) => {
                const showTierBreak = i > 0 && getTierClass(player.seasonRank) !== getTierClass(displayed[i - 1].seasonRank);
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
                    {TOURNAMENTS.map(t => {
                      const pts = player.tournamentPts[t.id];
                      const hasData = !!tournamentData[t.id];
                      const isIP = inProgressIds.has(t.id);

                      if (!hasData) {
                        return <td key={t.id} className="sb-col-tourney sb-cell sb-col-upcoming" />;
                      }

                      if (pts === undefined) {
                        return (
                          <td key={t.id} className="sb-col-tourney sb-cell sb-dns">
                            --
                          </td>
                        );
                      }

                      return (
                        <td
                          key={t.id}
                          className={`sb-col-tourney sb-cell ${isIP ? 'sb-live' : 'sb-score'}`}
                        >
                          {pts.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
