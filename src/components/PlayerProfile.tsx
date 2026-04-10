'use client';

import { PlayerSeason, TournamentData } from '@/lib/types';
import { useTournaments } from '@/lib/TournamentContext';
import { analyzeChalkVsContrarian } from '@/lib/utils';
import GolferHeadshot from './GolferHeadshot';

interface PlayerProfileProps {
  player: PlayerSeason;
  allTournamentData: Record<string, TournamentData>;
  onBack: () => void;
}

export default function PlayerProfile({ player, allTournamentData, onBack }: PlayerProfileProps) {
  const TOURNAMENTS = useTournaments();
  const played = player.tournaments.filter(t => t.status !== 'upcoming' && t.lineup.length > 0);
  const totalCutsMade = played.reduce((sum, t) => sum + t.cutsMade, 0);
  const totalGolfers = played.reduce((sum, t) => sum + t.totalGolfers, 0);

  const completedTournamentIds = new Set(
    TOURNAMENTS.filter(t => t.status === 'completed').map(t => t.id)
  );

  // Only count earnings from completed tournaments
  const completedEarnings = player.tournaments
    .filter(t => completedTournamentIds.has(t.tournamentId) && t.payout > 0)
    .reduce((sum, t) => sum + t.payout, 0);

  const tournamentAnalyses = played.map(pt => {
    const td = allTournamentData[pt.tournamentId];
    if (!td) return null;
    const analysis = analyzeChalkVsContrarian(pt.lineup, td.ownership);
    return { ...pt, analysis };
  }).filter(Boolean);

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 text-sm flex items-center gap-1 transition-colors cursor-pointer"
        style={{ color: 'var(--navy-700)' }}
      >
        &larr; Back to Dashboard
      </button>

      {/* Header */}
      <div className="cb-card mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--navy-800)' }}>
              {player.handle}
            </h1>
            <p className="text-sm text-gray-400 mt-1">DraftKings Player Profile</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-xs text-gray-400 uppercase">Season Rank</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--navy-800)' }}>
                #{player.seasonRank}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Total Points</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--gray-700)' }}>{player.totalPoints.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Earnings</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#16a34a' }}>
                ${completedEarnings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chalk vs Contrarian Analysis */}
        <div className="cb-card">
          <h3 className="cb-card-header">Player Analysis</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 rounded" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
              <p className="text-xs text-gray-400 uppercase">Play Style</p>
              <p className="text-lg font-bold mt-1" style={{
                color: player.chalkLabel.includes('Chalk') ? 'var(--gold-600)' :
                  player.chalkLabel.includes('Contrarian') ? '#2563eb' : 'var(--gray-600)'
              }}>
                {player.chalkLabel}
              </p>
            </div>
            <div className="text-center p-3 rounded" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
              <p className="text-xs text-gray-400 uppercase">Cut Rate</p>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--gray-700)' }}>
                {totalGolfers > 0 ? `${totalCutsMade} of ${totalGolfers}` : 'N/A'}
              </p>
              {totalGolfers > 0 && (
                <p className="text-xs text-gray-400">
                  {((totalCutsMade / totalGolfers) * 100).toFixed(0)}% make rate
                </p>
              )}
            </div>
          </div>

          {/* Per-tournament analysis */}
          {tournamentAnalyses.map(ta => {
            if (!ta) return null;
            return (
              <div key={ta.tournamentId} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--gray-200)' }}>
                <span className="text-sm" style={{ color: 'var(--gray-700)' }}>
                  {ta.shortName}
                  {ta.isMajor && <span className="badge badge-major ml-2 text-xs">Major</span>}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: 'var(--gold-600)' }}>{ta.analysis.chalkCount} chalk</span>
                  <span style={{ color: '#2563eb' }}>{ta.analysis.contrarianCount} contrarian</span>
                  <span className="text-gray-400">avg {ta.analysis.avgOwnership.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Golfer Usage History — with headshots */}
        <div className="cb-card">
          <h3 className="cb-card-header">Golfer Usage</h3>
          {player.golferUsage.length > 0 ? (
            <div className="space-y-1">
              {player.golferUsage.map(g => (
                <div key={g.golferName} className="flex items-center gap-2.5 py-1.5">
                  <GolferHeadshot golferName={g.golferName} size="sm" />
                  <span className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--gray-700)' }}>{g.golferName}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs cb-data" style={{ color: 'var(--gold-600)' }}>
                      {g.timesUsed} of {g.tournamentsPlayed}
                    </span>
                    <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--gray-200)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(g.timesUsed / g.tournamentsPlayed) * 100}%`,
                          background: 'linear-gradient(90deg, #BFA76A, #D4C089)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Tournament-by-Tournament Breakdown */}
      <div className="cb-card mt-6">
        <h3 className="cb-card-header">Tournament History</h3>
        <div className="overflow-x-auto">
          <table className="cb-table">
            <thead>
              <tr>
                <th>Tournament</th>
                <th>Position</th>
                <th>Points</th>
                <th>Adj. Points</th>
                <th>Cut</th>
                <th>Earnings</th>
                <th>Lineup</th>
              </tr>
            </thead>
            <tbody>
              {player.tournaments.map(t => {
                const isDNS = t.status !== 'upcoming' && t.lineup.length === 0;
                const isUpcoming = t.status === 'upcoming';
                const isCompleted = completedTournamentIds.has(t.tournamentId);

                if (isUpcoming) {
                  return (
                    <tr key={t.tournamentId} className="opacity-40">
                      <td>
                        {t.shortName}
                        {t.isMajor && <span className="badge badge-major ml-2 text-xs">M</span>}
                      </td>
                      <td colSpan={6} className="text-xs text-gray-400">Upcoming</td>
                    </tr>
                  );
                }

                if (isDNS) {
                  return (
                    <tr key={t.tournamentId}>
                      <td>
                        {t.shortName}
                        {t.isMajor && <span className="badge badge-major ml-2 text-xs">M</span>}
                      </td>
                      <td colSpan={6}>
                        <span className="badge badge-dns">DNS</span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={t.tournamentId}>
                    <td>
                      {t.shortName}
                      {t.isMajor && <span className="badge badge-major ml-2 text-xs">M</span>}
                    </td>
                    <td className="cb-data text-sm">{t.rank}</td>
                    <td className="cb-data text-sm">{t.points.toFixed(1)}</td>
                    <td className="cb-data text-sm" style={{ color: 'var(--gold-600)' }}>
                      {t.adjustedPoints.toFixed(1)}
                    </td>
                    <td className="text-sm">
                      {t.cutsMade}/{t.totalGolfers}
                    </td>
                    <td>
                      {isCompleted && t.payout > 0 ? (
                        <span className="font-semibold" style={{ color: '#16a34a' }}>${t.payout}</span>
                      ) : (
                        <span style={{ color: 'var(--gray-300)' }}>&mdash;</span>
                      )}
                    </td>
                    <td className="text-xs text-gray-400 max-w-xs truncate" style={{ textAlign: 'left' }}>
                      {t.lineup.join(', ')}
                    </td>
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
