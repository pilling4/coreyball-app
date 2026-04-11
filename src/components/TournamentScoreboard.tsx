'use client';

import { useState, useMemo, Fragment } from 'react';
import { TournamentData, PlayerSeason } from '@/lib/types';
import { getRoundLabel, formatUpdatedAt } from '@/lib/utils';
import { useTournaments } from '@/lib/TournamentContext';
import { useESPNData } from '@/lib/useESPNData';
import GolfClap from './GolfClap';
import PayoutModal from './PayoutModal';
import CutSummary from './CutSummary';
import GolferHeadshot from './GolferHeadshot';

interface TournamentScoreboardProps {
  tournamentData: Record<string, TournamentData>;
  playerSeasons: PlayerSeason[];
  onPlayerClick: (handle: string) => void;
}

function getHolesRemaining(timeRemaining: number): string {
  return timeRemaining.toString();
}

function getOwnershipForGolfer(golferName: string, ownership: TournamentData['ownership']): number {
  const found = ownership.find(o => o.golferName === golferName);
  return found ? found.pctDrafted : 0;
}

function getPointsForGolfer(golferName: string, ownership: TournamentData['ownership']): number {
  const found = ownership.find(o => o.golferName === golferName);
  return found ? found.fpts : 0;
}

export default function TournamentScoreboard({ tournamentData, playerSeasons, onPlayerClick }: TournamentScoreboardProps) {
  const TOURNAMENTS = useTournaments();
  const [selectedId, setSelectedId] = useState(
    TOURNAMENTS.find(t => t.status !== 'upcoming')?.id || TOURNAMENTS[0].id
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [golfClap, setGolfClap] = useState<{ player: string; tournament: string } | null>(null);
  const [showPayouts, setShowPayouts] = useState(false);
  const [showCutSummary, setShowCutSummary] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showRankInfo, setShowRankInfo] = useState(false);

  // Build a lookup from entryName -> seasonRank
  const seasonRankMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const ps of playerSeasons) {
      map.set(ps.handle, ps.seasonRank);
    }
    return map;
  }, [playerSeasons]);

  const currentData = tournamentData[selectedId];
  const currentTournament = TOURNAMENTS.find(t => t.id === selectedId)!;
  const isInProgress = currentTournament.status === 'in_progress';
  const isCompleted = currentTournament.status === 'completed';

  // Collect all unique golfer names from the current tournament for ESPN lookup
  const allGolferNames = useMemo(() => {
    if (!currentData || !isInProgress) return [];
    const names = new Set<string>();
    for (const entry of currentData.entries) {
      for (const g of entry.lineup) names.add(g);
    }
    return Array.from(names);
  }, [currentData, isInProgress]);

  const { golfers: espnData } = useESPNData(allGolferNames);

  const toggleRow = (entryId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  return (
    <div>
      {/* Tournament Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TOURNAMENTS.map(t => {
          const hasData = !!tournamentData[t.id];
          return (
            <button
              key={t.id}
              onClick={() => { setSelectedId(t.id); setExpandedRows(new Set()); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedId === t.id ? 'scale-105' : 'hover:scale-102'
              }`}
              style={selectedId === t.id ? {
                background: 'linear-gradient(135deg, #BFA76A, #D4C089, #A8935A)',
                color: 'var(--navy-900)',
                boxShadow: '0 2px 8px rgba(191, 167, 106, 0.3)',
              } : {
                background: hasData ? 'var(--gray-100)' : 'var(--gray-50)',
                color: hasData ? 'var(--gray-700)' : 'var(--gray-300)',
                border: '1px solid var(--gray-200)',
              }}
            >
              {t.shortName}
              {t.isMajor && <span className="ml-1 text-xs opacity-70">*</span>}
            </button>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="cb-card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--navy-800)' }}>
              {currentTournament.name}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(currentTournament.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} &ndash; {new Date(currentTournament.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {/* Row 1: Major · Round · Insights */}
            <div className="flex items-center gap-2">
              {currentTournament.isMajor && (
                <span className="text-xs font-semibold" style={{ color: 'var(--gold-600)' }}>
                  Major 1.25x
                </span>
              )}
              {currentData ? (
                <span className="text-xs font-semibold" style={{ color: isCompleted ? '#16a34a' : '#2563eb' }}>
                  {getRoundLabel(currentTournament.currentRound)}
                </span>
              ) : (
                <span className="text-xs font-semibold" style={{ color: 'var(--gray-400)' }}>
                  Upcoming
                </span>
              )}
              {currentData && (
                <button onClick={() => setShowInsights(true)} className="action-pill" title="Tournament insights">
                  {'\u{1F4CA}'} Insights
                </button>
              )}
            </div>
            {/* Row 2: Ownership · Lineups · Payouts */}
            <div className="flex items-center gap-2">
              {currentData && (
                <button
                  onClick={() => document.getElementById('ownership-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="action-pill"
                  title="View golfer ownership"
                >
                  {'\u{1F4CB}'} Ownership
                </button>
              )}
              {currentData && (
                <button onClick={() => setShowCutSummary(true)} className="action-pill" title="View lineups">
                  {'\u2702\uFE0F'} Lineups
                </button>
              )}
              <button onClick={() => setShowPayouts(true)} className="action-pill" title="View payout structure">
                {'\u{1F4B0}'} Payouts
              </button>
            </div>
          </div>
        </div>
        {currentData && currentTournament.updatedAt && (
          <p className="text-xs mt-2" style={{ color: 'var(--gold-600)' }}>
            Updated {formatUpdatedAt(currentTournament.updatedAt)} &middot; {getRoundLabel(currentTournament.currentRound)}
          </p>
        )}
      </div>

      {/* Scoreboard Table */}
      {currentData ? (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--gray-200)' }}>
          <table className="cb-table">
            <thead>
              <tr>
                <th className="w-20 relative">
                  <span className="inline-flex items-center gap-1">
                    Rank
                    {isInProgress && (
                      <button
                        onClick={() => setShowRankInfo(v => !v)}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: 'rgba(200, 173, 130, 0.25)', color: 'var(--gold-300)', fontSize: '0.6rem', lineHeight: 1 }}
                        title="Rank info"
                      >
                        i
                      </button>
                    )}
                  </span>
                  {showRankInfo && (
                    <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowRankInfo(false)} />
                    <div
                      className="absolute left-0 top-full mt-1 z-50 animate-slideDown"
                      style={{
                        background: 'linear-gradient(135deg, var(--navy-800), var(--navy-700))',
                        border: '1px solid var(--gold-500)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        width: '220px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      }}
                    >
                      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--gold-300)' }}>Rank Guide</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="cb-data text-xs font-bold" style={{ color: 'white' }}>3</span>
                        <span className="text-xs" style={{ color: 'var(--gray-300)' }}>Tournament rank this event</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="cb-data text-xs" style={{ color: 'var(--gold-400)' }}>(5)</span>
                        <span className="text-xs" style={{ color: 'var(--gray-300)' }}>Season rank (all events)</span>
                      </div>
                    </div>
                    </>
                  )}
                </th>
                <th>Player</th>
                <th>Points</th>
                {(isInProgress || isCompleted) && <th>Holes Rem.</th>}
                {isInProgress && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {currentData.entries.map((entry, i) => {
                const isExpanded = expandedRows.has(entry.entryId);
                return (
                  <Fragment key={entry.entryId}>
                    <tr
                      className={isInProgress ? 'expandable-row' : ''}
                      onClick={() => isInProgress && toggleRow(entry.entryId)}
                    >
                      <td className="cb-data text-sm" style={{ color: i < 3 ? 'var(--gold-600)' : 'var(--gray-500)', fontWeight: i < 3 ? 700 : 400 }}>
                        {entry.rank}
                        {isInProgress && seasonRankMap.has(entry.entryName) && (
                          <span className="ml-0.5 text-xs" style={{ color: 'var(--gold-400)', fontWeight: 400 }}>
                            ({seasonRankMap.get(entry.entryName)})
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={(e) => { e.stopPropagation(); onPlayerClick(entry.entryName); }}
                          className="player-link"
                        >
                          {entry.entryName}
                        </button>
                      </td>
                      <td className="cb-data text-sm font-semibold">
                        {entry.points.toFixed(1)}
                      </td>
                      {(isInProgress || isCompleted) && (
                        <td className="cb-data text-sm" style={{ color: 'var(--gray-500)' }}>
                          {getHolesRemaining(entry.timeRemaining)}
                        </td>
                      )}
                      {isInProgress && (
                        <td className="text-center">
                          <span className={`inline-block transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                            {'\u25BE'}
                          </span>
                        </td>
                      )}
                    </tr>
                    {/* Expanded Lineup Detail */}
                    {isInProgress && isExpanded && (
                      <tr className="expand-detail">
                        <td colSpan={5} style={{ textAlign: 'left' }}>
                          <div className="animate-expandRow overflow-hidden lineup-panel">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                              {[...entry.lineup].sort((a, b) => getPointsForGolfer(b, currentData.ownership) - getPointsForGolfer(a, currentData.ownership)).map(golfer => {
                                const ownership = getOwnershipForGolfer(golfer, currentData.ownership);
                                const pts = getPointsForGolfer(golfer, currentData.ownership);
                                const live = espnData[golfer];
                                const scoreColor = live?.score?.startsWith('-') ? '#16a34a' : live?.score?.startsWith('+') ? '#dc2626' : 'var(--gray-600)';
                                return (
                                  <div key={golfer} className="golfer-card">
                                    <GolferHeadshot golferName={golfer} size="md" espnHeadshot={live?.headshot} />
                                    <p className="text-xs font-semibold truncate mt-1.5 w-full" style={{ color: 'var(--navy-800)' }}>{golfer}</p>
                                    {live && (
                                      <div className="flex items-center justify-center mt-1">
                                        <span className="text-sm cb-data font-bold" style={{ color: scoreColor }}>
                                          {live.score === '0' ? 'E' : live.score}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                      <span className="text-xs" style={{ color: 'var(--gold-600)' }}>{ownership.toFixed(1)}%</span>
                                      <span className="text-xs cb-data font-semibold" style={{ color: 'var(--navy-700)' }}>{pts.toFixed(1)} pts</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cb-card text-center py-16">
          <p className="text-2xl mb-2">{'\u{26F3}'}</p>
          <p className="text-gray-400">Tournament hasn&apos;t started yet</p>
          <p className="text-xs text-gray-300 mt-1">Results will appear once Round 1 data is uploaded</p>
        </div>
      )}

      {/* Golf Clap Easter Egg */}
      {golfClap && (
        <GolfClap
          playerName={golfClap.player}
          tournamentName={golfClap.tournament}
          onClose={() => setGolfClap(null)}
        />
      )}

      <PayoutModal isOpen={showPayouts} onClose={() => setShowPayouts(false)} />

      {currentData && (
        <CutSummary
          isOpen={showCutSummary}
          onClose={() => setShowCutSummary(false)}
          entries={currentData.entries}
          currentRound={currentTournament.currentRound}
          tournamentName={currentTournament.name}
        />
      )}

      {/* Insights Modal */}
      {showInsights && currentData && (() => {
        const entries = currentData.entries;
        const ownership = currentData.ownership;
        const totalEntries = entries.length;
        const avgPts = entries.reduce((s, e) => s + e.points, 0) / totalEntries;
        const maxPts = entries[0]?.points || 0;
        const minPts = entries[entries.length - 1]?.points || 0;
        const medianPts = entries[Math.floor(totalEntries / 2)]?.points || 0;

        // Top 5 scoring golfers
        const topGolfers = [...ownership].sort((a, b) => b.fpts - a.fpts).slice(0, 5);

        // Most/least owned
        const mostOwned = [...ownership].sort((a, b) => b.pctDrafted - a.pctDrafted).slice(0, 3);
        const leastOwned = [...ownership].filter(o => o.pctDrafted > 0).sort((a, b) => a.pctDrafted - b.pctDrafted).slice(0, 3);

        // Best value: highest fpts with low ownership
        const bestValue = [...ownership]
          .filter(o => o.pctDrafted > 0 && o.pctDrafted <= 15)
          .sort((a, b) => b.fpts - a.fpts)
          .slice(0, 3);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7, 15, 27, 0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="relative w-full max-w-lg rounded-xl overflow-hidden animate-scaleIn" style={{ background: 'white', maxHeight: '85vh', overflowY: 'auto' }}>
              {/* Header */}
              <div className="sticky top-0 z-10 px-6 py-4" style={{ background: 'var(--navy-800)', borderBottom: '2px solid var(--gold-500)' }}>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-300)' }}>
                  {currentTournament.name} Insights
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--gold-500)' }}>
                  {getRoundLabel(currentTournament.currentRound)} &middot; {totalEntries} entries
                </p>
                <button
                  onClick={() => setShowInsights(false)}
                  className="absolute top-4 right-4 text-gold-300 hover:text-white cursor-pointer"
                  style={{ color: 'var(--gold-300)' }}
                >
                  {'\u2715'}
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Scoring Summary */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--navy-700)' }}>Scoring Summary</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'High', value: maxPts.toFixed(1) },
                      { label: 'Average', value: avgPts.toFixed(1) },
                      { label: 'Median', value: medianPts.toFixed(1) },
                      { label: 'Low', value: minPts.toFixed(1) },
                    ].map(stat => (
                      <div key={stat.label} className="text-center p-2.5 rounded-lg" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                        <p className="cb-data text-lg font-bold" style={{ color: 'var(--navy-800)' }}>{stat.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--gray-500)' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Scoring Golfers */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--navy-700)' }}>Top Scoring Golfers</h4>
                  <div className="space-y-2">
                    {topGolfers.map((g, i) => (
                      <div key={g.golferName} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ background: i === 0 ? 'rgba(168, 144, 88, 0.08)' : 'transparent' }}>
                        <div className="flex items-center gap-2">
                          <span className="cb-data text-xs font-bold" style={{ color: i < 3 ? 'var(--gold-600)' : 'var(--gray-400)', width: '16px' }}>{i + 1}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--navy-800)' }}>{g.golferName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: 'var(--gray-500)' }}>{g.pctDrafted.toFixed(0)}% owned</span>
                          <span className="cb-data text-sm font-bold" style={{ color: 'var(--navy-800)' }}>{g.fpts.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ownership Insights */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--navy-700)' }}>Most Owned</h4>
                    {mostOwned.map(g => (
                      <div key={g.golferName} className="flex justify-between py-1">
                        <span className="text-xs truncate mr-2" style={{ color: 'var(--gray-700)' }}>{g.golferName}</span>
                        <span className="cb-data text-xs font-semibold" style={{ color: 'var(--gold-600)' }}>{g.pctDrafted.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--navy-700)' }}>Best Value</h4>
                    {bestValue.map(g => (
                      <div key={g.golferName} className="flex justify-between py-1">
                        <span className="text-xs truncate mr-2" style={{ color: 'var(--gray-700)' }}>{g.golferName}</span>
                        <span className="cb-data text-xs font-semibold" style={{ color: '#16a34a' }}>{g.fpts.toFixed(1)} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spread */}
                <div className="pt-2" style={{ borderTop: '1px solid var(--gray-200)' }}>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--gray-500)' }}>
                    <span>Point Spread (1st to last)</span>
                    <span className="cb-data font-semibold" style={{ color: 'var(--navy-800)' }}>{(maxPts - minPts).toFixed(1)} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
