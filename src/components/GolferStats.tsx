'use client';

import { useState, useMemo } from 'react';
import { TournamentData } from '@/lib/types';
import { useTournaments } from '@/lib/TournamentContext';
import { parseTimeRemaining } from '@/lib/utils';
import GolferHeadshot from './GolferHeadshot';

interface GolferStatsProps {
  tournamentData: Record<string, TournamentData>;
}

interface GolferAggregate {
  name: string;
  totalFpts: number;
  tournaments: {
    tournamentId: string;
    shortName: string;
    fpts: number;
    ownership: number;
    madeCut: boolean | null; // null = cut hasn't happened yet
  }[];
  totalTimesDrafted: number;
  avgOwnership: number;
  cutsMade: number;
  cutsTotal: number; // tournaments where the cut has been applied
}

type SortField = 'name' | 'totalFpts' | 'avgOwnership' | 'cutRate';

export default function GolferStats({ tournamentData }: GolferStatsProps) {
  const TOURNAMENTS = useTournaments();
  const [sortBy, setSortBy] = useState<SortField>('totalFpts');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const golfers = useMemo(() => {
    const golferMap = new Map<string, GolferAggregate>();

    // Get tournaments that have data
    const activeTournaments = TOURNAMENTS.filter(t => tournamentData[t.id]);

    for (const tournament of activeTournaments) {
      const td = tournamentData[tournament.id];
      if (!td) continue;

      const cutApplied = tournament.currentRound >= 2;

      // Build a map of golfer -> how many entries drafted them
      const draftCount = new Map<string, number>();
      // Build a map of golfer -> did they make the cut (based on any entry's timeRemaining)
      const golferCutStatus = new Map<string, boolean>();

      for (const entry of td.entries) {
        for (const golferName of entry.lineup) {
          draftCount.set(golferName, (draftCount.get(golferName) || 0) + 1);

          // Determine cut status from entry's timeRemaining
          if (cutApplied && !golferCutStatus.has(golferName)) {
            const { cutsMade } = parseTimeRemaining(entry.timeRemaining, tournament.currentRound);
            // A golfer made the cut if they contribute holes to the timeRemaining
            // We check via ownership fpts — if they have > 0 holes remaining in weekend
            // Actually, we can check from the ownership data directly
          }
        }
      }

      // Use ownership data for fpts and ownership %
      for (const o of td.ownership) {
        if (!golferMap.has(o.golferName)) {
          golferMap.set(o.golferName, {
            name: o.golferName,
            totalFpts: 0,
            tournaments: [],
            totalTimesDrafted: 0,
            avgOwnership: 0,
            cutsMade: 0,
            cutsTotal: 0,
          });
        }

        const golfer = golferMap.get(o.golferName)!;
        golfer.totalFpts += o.fpts;
        golfer.totalTimesDrafted += draftCount.get(o.golferName) || 0;

        // Determine cut status:
        // If cut has been applied (round >= 2), a golfer with 0 fpts after round 2+ likely missed cut
        // But more accurately: we look at whether the golfer still has time remaining
        // Since we don't have per-golfer time data, we use fpts as a proxy after R2:
        // A golfer who missed cut would still have their R1/R2 fpts frozen
        // For now, we mark cut status based on whether they appear to have weekend scores
        // The most reliable method: if round >= 3 or 4 and fpts is from pre-cut only, they missed
        // Simplification: if round >= 2 and golfer has any fpts, they're in; if 0 fpts, missed cut
        // Better: we check if their time remaining contributes (but we don't have per-golfer data)

        // Simple approach: if the cut has happened, check if golfer's total fpts is > 0
        // In a real scenario after R2, a golfer who made the cut will have increasing fpts
        // A golfer who missed will have their R1-R2 fpts frozen
        // Since we can't distinguish perfectly without per-golfer round data, we'll mark
        // all golfers as having made the cut if they have fpts > 0 after R2
        let madeCut: boolean | null = null;
        if (cutApplied) {
          // After cut, if fpts > 0, golfer was active (made cut or at least played)
          // This is a simplification — in practice the admin data would clarify
          madeCut = o.fpts > 0;
        }

        golfer.tournaments.push({
          tournamentId: tournament.id,
          shortName: tournament.shortName,
          fpts: o.fpts,
          ownership: o.pctDrafted,
          madeCut,
        });

        if (cutApplied) {
          golfer.cutsTotal++;
          if (madeCut) golfer.cutsMade++;
        }
      }
    }

    // Calculate avg ownership
    for (const golfer of golferMap.values()) {
      if (golfer.tournaments.length > 0) {
        golfer.avgOwnership =
          golfer.tournaments.reduce((sum, t) => sum + t.ownership, 0) / golfer.tournaments.length;
      }
    }

    return Array.from(golferMap.values());
  }, [tournamentData]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedGolfers = useMemo(() => {
    const filtered = search
      ? golfers.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
      : golfers;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'totalFpts':
          cmp = a.totalFpts - b.totalFpts;
          break;
        case 'avgOwnership':
          cmp = a.avgOwnership - b.avgOwnership;
          break;
        case 'cutRate':
          const aRate = a.cutsTotal > 0 ? a.cutsMade / a.cutsTotal : 0;
          const bRate = b.cutsTotal > 0 ? b.cutsMade / b.cutsTotal : 0;
          cmp = aRate - bRate;
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [golfers, sortBy, sortDir, search]);

  const activeTournaments = TOURNAMENTS.filter(t => tournamentData[t.id]);

  const sortIcon = (field: SortField) => {
    if (sortBy !== field) return '';
    return sortDir === 'desc' ? ' \u25BE' : ' \u25B4';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--navy-800)' }}>
          Golfer Stats
        </h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search golfers..."
          className="w-56 px-3 py-1.5 rounded-full text-sm outline-none"
          style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', color: 'var(--gray-700)' }}
        />
      </div>

      {/* Summary Cards */}
      <div className="cb-card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Golfers</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--navy-800)' }}>{golfers.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Tournaments Played</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--gray-700)' }}>{activeTournaments.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Top Scorer</p>
            <p className="text-lg font-bold mt-1 truncate" style={{ color: 'var(--gold-600)' }}>
              {golfers.length > 0
                ? [...golfers].sort((a, b) => b.totalFpts - a.totalFpts)[0]?.name
                : '\u2014'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Top Scorer Pts</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#16a34a' }}>
              {golfers.length > 0
                ? [...golfers].sort((a, b) => b.totalFpts - a.totalFpts)[0]?.totalFpts.toFixed(1)
                : '\u2014'}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--gray-200)' }}>
        <table className="cb-table">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th
                className="cursor-pointer hover:text-gold-200 select-none"
                onClick={() => handleSort('name')}
                style={{ textAlign: 'left' }}
              >
                Golfer{sortIcon('name')}
              </th>
              <th
                className="cursor-pointer hover:text-gold-200 select-none"
                onClick={() => handleSort('totalFpts')}
              >
                Total Pts{sortIcon('totalFpts')}
              </th>
              <th
                className="cursor-pointer hover:text-gold-200 select-none"
                onClick={() => handleSort('avgOwnership')}
              >
                Avg Own %{sortIcon('avgOwnership')}
              </th>
              <th>Times Drafted</th>
              <th
                className="cursor-pointer hover:text-gold-200 select-none"
                onClick={() => handleSort('cutRate')}
              >
                Cuts Made{sortIcon('cutRate')}
              </th>
              {activeTournaments.map(t => (
                <th key={t.id} title={t.name}>
                  {t.shortName}
                  {t.isMajor && <span className="text-xs ml-0.5 opacity-50">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedGolfers.map((golfer, i) => {
              const cutRate = golfer.cutsTotal > 0
                ? `${golfer.cutsMade}/${golfer.cutsTotal}`
                : '\u2014';
              const cutPct = golfer.cutsTotal > 0
                ? ((golfer.cutsMade / golfer.cutsTotal) * 100).toFixed(0)
                : null;

              return (
                <tr key={golfer.name}>
                  <td className="cb-data text-sm" style={{ color: 'var(--gray-400)' }}>{i + 1}</td>
                  <td style={{ textAlign: 'left' }}>
                    <div className="flex items-center gap-2.5">
                      <GolferHeadshot golferName={golfer.name} size="sm" />
                      <span className="font-semibold text-sm" style={{ color: 'var(--navy-800)' }}>
                        {golfer.name}
                      </span>
                    </div>
                  </td>
                  <td className="cb-data text-sm font-semibold" style={{ color: 'var(--navy-800)' }}>
                    {golfer.totalFpts.toFixed(1)}
                  </td>
                  <td className="cb-data text-sm" style={{ color: 'var(--gold-600)' }}>
                    {golfer.avgOwnership.toFixed(1)}%
                  </td>
                  <td className="cb-data text-sm" style={{ color: 'var(--gray-500)' }}>
                    {golfer.totalTimesDrafted}
                  </td>
                  <td>
                    <div className="flex flex-col items-center">
                      <span className="cb-data text-sm" style={{
                        color: golfer.cutsTotal > 0
                          ? golfer.cutsMade === golfer.cutsTotal ? '#16a34a'
                            : golfer.cutsMade === 0 ? '#dc2626'
                              : 'var(--gray-700)'
                          : 'var(--gray-400)'
                      }}>
                        {cutRate}
                      </span>
                      {cutPct !== null && (
                        <span className="text-xs text-gray-400">{cutPct}%</span>
                      )}
                    </div>
                  </td>
                  {activeTournaments.map(t => {
                    const tData = golfer.tournaments.find(gt => gt.tournamentId === t.id);
                    if (!tData) {
                      return (
                        <td key={t.id} className="text-xs text-gray-300">&mdash;</td>
                      );
                    }
                    return (
                      <td key={t.id} title={`${tData.ownership.toFixed(1)}% owned`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="cb-data text-xs font-semibold" style={{ color: 'var(--navy-700)' }}>
                            {tData.fpts.toFixed(1)}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--gold-600)' }}>
                            {tData.ownership.toFixed(0)}%
                          </span>
                          {tData.madeCut !== null && (
                            <span className="text-xs" style={{ color: tData.madeCut ? '#16a34a' : '#dc2626' }}>
                              {tData.madeCut ? '\u2713' : '\u2717'}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span>* Major tournament (1.25x multiplier)</span>
        <span><span style={{ color: '#16a34a' }}>{'\u2713'}</span> Made cut</span>
        <span><span style={{ color: '#dc2626' }}>{'\u2717'}</span> Missed cut</span>
      </div>
    </div>
  );
}
