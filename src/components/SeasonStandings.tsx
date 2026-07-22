'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlayerSeason, TournamentData } from '@/lib/types';
import { calculateAdjustedPoints, computeSeasonPrizes } from '@/lib/utils';
import { useTournaments } from '@/lib/TournamentContext';
import PayoutModal from './PayoutModal';
import ChampionModal from './ChampionModal';
import LeaderboardScoreboard from './LeaderboardScoreboard';

interface SeasonStandingsProps {
  playerSeasons: PlayerSeason[];
  tournamentData: Record<string, TournamentData>;
  onPlayerClick: (handle: string) => void;
}

export default function SeasonStandings({ playerSeasons, tournamentData, onPlayerClick }: SeasonStandingsProps) {
  const TOURNAMENTS = useTournaments();
  const [showPayouts, setShowPayouts] = useState(false);
  const [showChampion, setShowChampion] = useState(false);

  // Season is complete when every scheduled tournament has status 'completed'.
  const isSeasonComplete = TOURNAMENTS.length > 0 && TOURNAMENTS.every(t => t.status === 'completed');

  const activeTournaments = TOURNAMENTS.filter(t => tournamentData[t.id]);
  const completedTournamentIds = new Set(
    TOURNAMENTS.filter(t => t.status === 'completed').map(t => t.id)
  );
  const inProgressTournamentIds = new Set(
    TOURNAMENTS.filter(t => t.status === 'in_progress').map(t => t.id)
  );

  // Determine the most recent tournament with data (for rank change calculation)
  const activeIds = TOURNAMENTS
    .filter(t => tournamentData[t.id])
    .map(t => t.id);
  const latestTournamentId = activeIds.length > 0 ? activeIds[activeIds.length - 1] : null;

  // Total Points = completed tournaments (with multiplier) + in-progress tournaments (with multiplier)
  const standingsData = playerSeasons.map(p => {
    let totalPts = 0;
    let prevPts = 0; // points excluding the latest tournament
    for (const t of p.tournaments) {
      if (t.lineup.length === 0) continue;
      if (completedTournamentIds.has(t.tournamentId) || inProgressTournamentIds.has(t.tournamentId)) {
        const adj = calculateAdjustedPoints(t.points, t.multiplier);
        totalPts += adj;
        if (t.tournamentId !== latestTournamentId) {
          prevPts += adj;
        }
      }
    }
    return { ...p, calculatedTotal: totalPts, prevTotal: prevPts };
  }).sort((a, b) => b.calculatedTotal - a.calculatedTotal);

  // Calculate previous week ranks
  const prevRanks = new Map<string, number>();
  if (latestTournamentId && activeIds.length > 1) {
    const prevSorted = [...standingsData].sort((a, b) => b.prevTotal - a.prevTotal);
    prevSorted.forEach((p, i) => prevRanks.set(p.handle, i + 1));
  }

  // Season-long prize pool payouts to top 3 (with tie splitting), only after
  // every tournament is completed.
  const seasonPrizes = useMemo(() => {
    if (!isSeasonComplete) return new Map<string, { amount: number; rank: number }>();
    const ordered = standingsData.map(p => p.handle);
    const points = new Map(standingsData.map(p => [p.handle, p.calculatedTotal]));
    return computeSeasonPrizes(ordered, points);
  }, [isSeasonComplete, standingsData]);

  // Champion = the entry ranked 1st (or a shared tie-for-1st winner — pick the
  // first alphabetically for stable display when there's a dead heat).
  const champion = useMemo(() => {
    if (!isSeasonComplete || standingsData.length === 0) return null;
    const topPts = standingsData[0].calculatedTotal;
    const tiedWinners = standingsData.filter(p => p.calculatedTotal === topPts).map(p => p.handle);
    return tiedWinners.length > 1
      ? tiedWinners.slice().sort().join(' & ')
      : tiedWinners[0];
  }, [isSeasonComplete, standingsData]);

  // Total winnings for the champion popup = tournament payouts + season prize.
  const championWinnings = useMemo(() => {
    if (!champion || !isSeasonComplete) return 0;
    const names = champion.split(' & ');
    let total = 0;
    for (const name of names) {
      const p = playerSeasons.find(ps => ps.handle === name);
      const seasonPrize = seasonPrizes.get(name)?.amount ?? 0;
      total += (p?.totalEarnings ?? 0) + seasonPrize;
    }
    // For a shared championship display average per-person prize
    return names.length > 1 ? Math.round(total / names.length) : total;
  }, [champion, isSeasonComplete, playerSeasons, seasonPrizes]);

  // Fire the champion popup once per session when the season finishes.
  useEffect(() => {
    if (!isSeasonComplete || !champion) return;
    const seenKey = 'coreyball-champion-seen-2026';
    if (typeof window !== 'undefined' && sessionStorage.getItem(seenKey)) return;
    setShowChampion(true);
    if (typeof window !== 'undefined') sessionStorage.setItem(seenKey, '1');
  }, [isSeasonComplete, champion]);

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
        prevRanks={prevRanks}
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
                    <div className="flex items-center justify-center gap-1">
                      {rankEmoji ? (
                        <span className="text-base">{rankEmoji}</span>
                      ) : (
                        <span style={{ color: 'var(--gray-500)' }}>{i + 1}</span>
                      )}
                      {prevRanks.size > 0 && (() => {
                        const currentRank = i + 1;
                        const prevRank = prevRanks.get(player.handle);
                        if (!prevRank) return null;
                        const diff = prevRank - currentRank;
                        if (diff > 0) return (
                          <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>
                            {'\u25B2'}{diff}
                          </span>
                        );
                        if (diff < 0) return (
                          <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>
                            {'\u25BC'}{Math.abs(diff)}
                          </span>
                        );
                        return (
                          <span className="text-xs" style={{ color: 'var(--gray-400)' }}>{'\u2013'}</span>
                        );
                      })()}
                    </div>
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
                    <div className="flex flex-col items-center leading-tight">
                      <span>{player.calculatedTotal > 0 ? player.calculatedTotal.toFixed(1) : '\u2014'}</span>
                      {(() => {
                        const prize = seasonPrizes.get(player.handle);
                        if (!prize) return null;
                        return (
                          <span className="text-xs font-bold mt-0.5" style={{ color: '#16a34a' }}>
                            +${prize.amount.toLocaleString()}
                          </span>
                        );
                      })()}
                    </div>
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

      {isSeasonComplete && champion && (
        <>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowChampion(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #BFA76A, #D4C089, #A8935A)',
                color: 'var(--navy-900)',
                boxShadow: '0 4px 16px rgba(191, 167, 106, 0.3)',
              }}
            >
              {'\u{1F3C6}'} View 2026 Champion
            </button>
          </div>
          <ChampionModal
            isOpen={showChampion}
            onClose={() => setShowChampion(false)}
            champion={champion}
            totalWinnings={championWinnings}
          />
        </>
      )}
    </div>
  );
}
