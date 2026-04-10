'use client';

import { Entry } from '@/lib/types';

interface CutSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Entry[];
  currentRound: number;
  tournamentName: string;
}

function getGolfersRemaining(timeRemaining: number, currentRound: number): number {
  // Before the cut (Round 1), all 6 golfers are in
  if (currentRound <= 1) return 6;

  // After Round 2: 2 weekend rounds remain = 36 holes per golfer
  // After Round 3: 1 final round remains = 18 holes per golfer
  const holesPerGolfer = currentRound === 2 ? 36 : 18;
  const remaining = Math.round(timeRemaining / holesPerGolfer);
  return Math.min(remaining, 6);
}

const BUCKET_COLORS: Record<number, string> = {
  6: '#16a34a',
  5: '#22c55e',
  4: '#84cc16',
  3: '#eab308',
  2: '#f97316',
  1: '#ef4444',
  0: '#991b1b',
};

const BUCKET_BG: Record<number, string> = {
  6: 'rgba(22, 163, 74, 0.08)',
  5: 'rgba(34, 197, 94, 0.08)',
  4: 'rgba(132, 204, 22, 0.08)',
  3: 'rgba(234, 179, 8, 0.08)',
  2: 'rgba(249, 115, 22, 0.08)',
  1: 'rgba(239, 68, 68, 0.08)',
  0: 'rgba(153, 27, 27, 0.08)',
};

export default function CutSummary({ isOpen, onClose, entries, currentRound, tournamentName }: CutSummaryProps) {
  if (!isOpen) return null;

  const totalEntries = entries.length;

  // Bucket entries by golfers remaining
  const buckets: Record<number, number> = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
  for (const entry of entries) {
    const remaining = getGolfersRemaining(entry.timeRemaining, currentRound);
    buckets[remaining] = (buckets[remaining] || 0) + 1;
  }

  const maxCount = Math.max(...Object.values(buckets), 1);

  // Average golfers remaining
  let totalGolfers = 0;
  for (const [count, num] of Object.entries(buckets)) {
    totalGolfers += parseInt(count) * num;
  }
  const avgRemaining = totalEntries > 0 ? (totalGolfers / totalEntries).toFixed(1) : '0';

  // Players with full roster
  const fullRoster = buckets[6];
  const fullRosterPct = totalEntries > 0 ? ((fullRoster / totalEntries) * 100).toFixed(0) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative animate-scaleIn max-w-md w-full bg-white rounded-2xl p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
        style={{ border: '2px solid var(--gold-500)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--navy-800)' }}>
              Cut Summary
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{tournamentName} &middot; After Round {currentRound}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer">&times;</button>
        </div>

        {currentRound < 2 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">{'\u2702\uFE0F'}</p>
            <p className="text-gray-400 text-sm">Cut data available after Round 2</p>
            <p className="text-xs text-gray-300 mt-1">Check back Friday evening</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 rounded-lg" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                <p className="text-xs text-gray-400 uppercase">Entries</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--navy-800)' }}>{totalEntries}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                <p className="text-xs text-gray-400 uppercase">Avg Remaining</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--gold-600)' }}>{avgRemaining}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                <p className="text-xs text-gray-400 uppercase">Full Roster</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: '#16a34a' }}>{fullRosterPct}%</p>
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-2.5">
              {[6, 5, 4, 3, 2, 1, 0].map(count => {
                const num = buckets[count];
                const pct = totalEntries > 0 ? ((num / totalEntries) * 100).toFixed(0) : '0';
                const barWidth = maxCount > 0 ? (num / maxCount) * 100 : 0;
                return (
                  <div key={count} className="flex items-center gap-3 py-1.5 px-3 rounded-lg" style={{ background: BUCKET_BG[count] }}>
                    <span
                      className="text-sm font-bold cb-data w-8 text-center flex-shrink-0"
                      style={{ color: BUCKET_COLORS[count] }}
                    >
                      {count}/6
                    </span>
                    <div className="flex-1 cut-bar-track">
                      <div
                        className="cut-bar"
                        style={{ width: `${barWidth}%`, background: BUCKET_COLORS[count] }}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 w-20 justify-end">
                      <span className="text-sm font-semibold cb-data" style={{ color: 'var(--gray-700)' }}>{num}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
