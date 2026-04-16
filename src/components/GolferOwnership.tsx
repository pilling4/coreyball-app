'use client';

import { TournamentData } from '@/lib/types';
import { CHALK_THRESHOLD, CONTRARIAN_THRESHOLD } from '@/lib/constants';
import { useTournaments } from '@/lib/TournamentContext';

interface GolferOwnershipProps {
  tournamentData: Record<string, TournamentData>;
  selectedTournamentId: string;
}

export default function GolferOwnership({ tournamentData, selectedTournamentId }: GolferOwnershipProps) {
  const TOURNAMENTS = useTournaments();
  const currentTournament = TOURNAMENTS.find(t => t.id === selectedTournamentId);
  const currentData = tournamentData[selectedTournamentId];

  if (!currentData || currentData.ownership.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No ownership data available</p>
      </div>
    );
  }

  const sortedOwnership = [...currentData.ownership].sort((a, b) => b.pctDrafted - a.pctDrafted);

  return (
    <div>
      <div className="cb-card-header flex items-center justify-between">
        <span>Golfer Ownership</span>
        {currentTournament && (
          <span className="text-xs font-medium" style={{ color: 'var(--gold-600)' }}>
            {currentTournament.name}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--gray-200)' }}>
        <table className="cb-table">
          <thead>
            <tr>
              <th>Golfer</th>
              <th>Ownership</th>
              <th>FPTS</th>
              <th className="w-40">Ownership Bar</th>
            </tr>
          </thead>
          <tbody>
            {sortedOwnership.map(golfer => {
              const isChalk = golfer.pctDrafted >= CHALK_THRESHOLD;
              const isContrarian = golfer.pctDrafted < CONTRARIAN_THRESHOLD;
              return (
                <tr key={golfer.golferName}>
                  <td className="font-medium" style={{ color: 'var(--gray-800)' }}>
                    {golfer.golferName}
                    {isChalk && <span className="ml-2 text-xs" style={{ color: 'var(--gold-600)' }} title="Chalk">*</span>}
                  </td>
                  <td className="cb-data text-sm">
                    <span style={{ color: isChalk ? 'var(--gold-600)' : isContrarian ? '#2563eb' : 'var(--gray-500)' }}>
                      {golfer.pctDrafted.toFixed(1)}%
                    </span>
                  </td>
                  <td className="cb-data text-sm">{golfer.fpts.toFixed(1)}</td>
                  <td>
                    <div className="w-full h-2 rounded-full" style={{ background: 'var(--gray-200)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(golfer.pctDrafted * 2, 100)}%`,
                          background: isChalk
                            ? 'linear-gradient(90deg, #BFA76A, #D4C089)'
                            : isContrarian
                              ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                              : 'linear-gradient(90deg, #9ca3af, #d1d5db)',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span><span style={{ color: 'var(--gold-600)' }}>*</span> Chalk ({'\u2265'}{CHALK_THRESHOLD}%)</span>
        <span><span className="text-blue-500">{'\u2022'}</span> Contrarian (&lt;{CONTRARIAN_THRESHOLD}%)</span>
      </div>
    </div>
  );
}
