'use client';

import { useMemo, useState } from 'react';
import { PlayerSeason } from '@/lib/types';
import { TOTAL_POT, PAYOUTS } from '@/lib/constants';
import { useTournaments } from '@/lib/TournamentContext';
import { calculateAdjustedPoints, computeSeasonPrizes } from '@/lib/utils';
import GolfClap from './GolfClap';

interface SeasonEarningsProps {
  playerSeasons: PlayerSeason[];
  onPlayerClick: (handle: string) => void;
}

export default function SeasonEarnings({ playerSeasons, onPlayerClick }: SeasonEarningsProps) {
  const TOURNAMENTS = useTournaments();
  const [golfClap, setGolfClap] = useState<{ player: string; tournament: string } | null>(null);

  // Only count earnings from completed tournaments
  const completedTournamentIds = new Set(
    TOURNAMENTS.filter(t => t.status === 'completed').map(t => t.id)
  );
  const inProgressTournamentIds = new Set(
    TOURNAMENTS.filter(t => t.status === 'in_progress').map(t => t.id)
  );
  const isSeasonComplete = TOURNAMENTS.length > 0 && TOURNAMENTS.every(t => t.status === 'completed');

  // Season-long prizes are only awarded once every event has finished. Use the
  // same total-points calculation as SeasonStandings (completed + in-progress
  // adjusted points) and the shared tie-splitting helper.
  const seasonPrizes = useMemo(() => {
    if (!isSeasonComplete) return new Map<string, { amount: number; rank: number }>();
    const totals = playerSeasons.map(p => {
      let total = 0;
      for (const t of p.tournaments) {
        if (t.lineup.length === 0) continue;
        if (completedTournamentIds.has(t.tournamentId) || inProgressTournamentIds.has(t.tournamentId)) {
          total += calculateAdjustedPoints(t.points, t.multiplier);
        }
      }
      return { handle: p.handle, total };
    }).sort((a, b) => b.total - a.total);

    const ordered = totals.map(t => t.handle);
    const pts = new Map(totals.map(t => [t.handle, t.total]));
    return computeSeasonPrizes(ordered, pts);
    // completedTournamentIds/inProgressTournamentIds recreated each render but
    // their content is derived from TOURNAMENTS, so keying on TOURNAMENTS is
    // sufficient to invalidate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeasonComplete, playerSeasons, TOURNAMENTS]);

  const playersWithEarnings = playerSeasons
    .map(p => {
      const eventEarnings = p.tournaments
        .filter(t => completedTournamentIds.has(t.tournamentId) && t.payout > 0)
        .reduce((sum, t) => sum + t.payout, 0);
      const completedAwards = p.tournaments.filter(
        t => completedTournamentIds.has(t.tournamentId) && t.payout > 0
      );
      const seasonPrize = seasonPrizes.get(p.handle);
      const completedEarnings = eventEarnings + (seasonPrize?.amount ?? 0);
      return { ...p, completedEarnings, eventEarnings, completedAwards, seasonPrize };
    })
    .filter(p => p.completedEarnings > 0)
    .sort((a, b) => b.completedEarnings - a.completedEarnings);

  const totalDistributed = playersWithEarnings.reduce((sum, p) => sum + p.completedEarnings, 0);

  return (
    <div>
      {/* Prize Pool Header */}
      <div className="cb-card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Prize Pool</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--navy-800)' }}>${TOTAL_POT.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Distributed</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#16a34a' }}>${totalDistributed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Remaining</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--gray-500)' }}>${(TOTAL_POT - totalDistributed).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Season-Long Prizes</p>
            <div className="flex items-center justify-center gap-2 mt-1 text-sm" style={{ color: 'var(--gray-700)' }}>
              <span>{'\u{1F947}'} ${PAYOUTS.season.first.amount}</span>
              <span>{'\u{1F948}'} ${PAYOUTS.season.second.amount}</span>
              <span>{'\u{1F949}'} ${PAYOUTS.season.third.amount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      {playersWithEarnings.length > 0 ? (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--gray-200)' }}>
          <table className="cb-table">
            <thead>
              <tr>
                <th className="w-14">#</th>
                <th>Player</th>
                <th>Tournament Wins</th>
                <th>Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {playersWithEarnings.map((player, i) => (
                <tr key={player.handle}>
                  <td className="cb-data text-sm" style={{ color: 'var(--gray-500)' }}>{i + 1}</td>
                  <td>
                    <button
                      onClick={() => onPlayerClick(player.handle)}
                      className="player-link"
                    >
                      {player.handle}
                    </button>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {player.seasonPrize && (
                        <span
                          className="badge badge-payout"
                          title={`Season ${player.seasonPrize.rank === 1 ? 'Champion' : player.seasonPrize.rank === 2 ? 'Runner-Up' : '3rd Place'} — $${player.seasonPrize.amount.toLocaleString()}`}
                          style={{
                            background: 'linear-gradient(135deg, #BFA76A, #D4C089, #A8935A)',
                            color: 'var(--navy-900)',
                            border: '1px solid var(--gold-600)',
                            fontWeight: 700,
                          }}
                        >
                          {player.seasonPrize.rank === 1
                            ? `\u{1F3C6} League Champ`
                            : player.seasonPrize.rank === 2
                              ? `\u{1F948} 2nd`
                              : `\u{1F949} 3rd`}
                        </span>
                      )}
                      {player.completedAwards.map(award => (
                        <button
                          key={award.tournamentId}
                          onClick={() => award.rank === 1 ?
                            setGolfClap({ player: player.handle, tournament: award.tournamentName }) : undefined
                          }
                          className={`badge badge-payout ${award.rank === 1 ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                          title={`${award.rank === 1 ? '1st' : '2nd'} - $${award.payout}`}
                        >
                          {award.rank === 1 ? '\u{1F3C6}' : '\u{1F948}'} {award.shortName}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold text-lg" style={{ color: '#16a34a' }}>
                      ${player.completedEarnings.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cb-card text-center py-12">
          <p className="text-2xl mb-2">{'\u{1F4B0}'}</p>
          <p className="text-gray-400">No earnings yet</p>
          <p className="text-xs text-gray-300 mt-1">Payouts are assigned after each tournament is finalized</p>
        </div>
      )}

      {golfClap && (
        <GolfClap
          playerName={golfClap.player}
          tournamentName={golfClap.tournament}
          onClose={() => setGolfClap(null)}
        />
      )}
    </div>
  );
}
