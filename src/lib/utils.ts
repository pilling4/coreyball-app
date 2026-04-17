import { Entry, GolferOwnership, GolferUsage, PlayerSeason, PlayerTournamentResult, TournamentData, Award, SeasonEarningsEntry } from './types';
import { TOURNAMENTS, PAYOUTS, CHALK_THRESHOLD, CONTRARIAN_THRESHOLD } from './constants';

export function parseTimeRemaining(timeRemaining: number, currentRound: number): { cutsMade: number; totalGolfers: number } {
  const totalGolfers = 6;
  if (currentRound <= 1) {
    return { cutsMade: totalGolfers, totalGolfers };
  }
  if (currentRound === 2) {
    return { cutsMade: Math.round(timeRemaining / 36), totalGolfers };
  }
  if (currentRound === 3) {
    return { cutsMade: Math.round(timeRemaining / 18), totalGolfers };
  }
  return { cutsMade: Math.round(timeRemaining / 18) || 0, totalGolfers };
}

export function getRoundLabel(currentRound: number): string {
  if (currentRound === 0) return 'Not Started';
  if (currentRound >= 4) return 'Final';
  return `Thru Round ${currentRound}`;
}

export function formatUpdatedAt(updatedAt: string): string {
  if (!updatedAt) return '';
  const d = new Date(updatedAt);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function calculateAdjustedPoints(points: number, multiplier: number): number {
  return Math.round(points * multiplier * 100) / 100;
}

export function analyzeChalkVsContrarian(
  lineup: string[],
  ownership: GolferOwnership[]
): { chalkCount: number; contrarianCount: number; avgOwnership: number; label: string } {
  const ownershipMap = new Map(ownership.map(o => [o.golferName, o.pctDrafted]));
  let chalkCount = 0;
  let contrarianCount = 0;
  let totalOwnership = 0;

  for (const golfer of lineup) {
    const pct = ownershipMap.get(golfer) || 0;
    totalOwnership += pct;
    if (pct >= CHALK_THRESHOLD) chalkCount++;
    if (pct < CONTRARIAN_THRESHOLD) contrarianCount++;
  }

  const avgOwnership = totalOwnership / lineup.length;
  let label = 'Balanced';
  if (chalkCount >= 4) label = 'Heavy Chalk';
  else if (chalkCount >= 3) label = 'Chalk Leaning';
  else if (contrarianCount >= 4) label = 'Contrarian';
  else if (contrarianCount >= 3) label = 'Contrarian Leaning';

  return { chalkCount, contrarianCount, avgOwnership, label };
}

export function buildGolferUsage(tournaments: PlayerTournamentResult[]): GolferUsage[] {
  const usage = new Map<string, { timesUsed: number; tournaments: string[] }>();
  const played = tournaments.filter(t => t.status !== 'upcoming');

  for (const t of played) {
    for (const golfer of t.lineup) {
      const existing = usage.get(golfer) || { timesUsed: 0, tournaments: [] };
      existing.timesUsed++;
      existing.tournaments.push(t.shortName);
      usage.set(golfer, existing);
    }
  }

  return Array.from(usage.entries())
    .map(([golferName, data]) => ({
      golferName,
      timesUsed: data.timesUsed,
      tournamentsPlayed: played.length,
      tournaments: data.tournaments,
    }))
    .sort((a, b) => b.timesUsed - a.timesUsed);
}

export function buildPlayerSeasons(allTournamentData: TournamentData[]): PlayerSeason[] {
  const playerMap = new Map<string, PlayerSeason>();

  for (const td of allTournamentData) {
    const t = td.tournament;
    for (const entry of td.entries) {
      if (!playerMap.has(entry.entryName)) {
        playerMap.set(entry.entryName, {
          handle: entry.entryName,
          totalPoints: 0,
          totalEarnings: 0,
          seasonRank: 0,
          tournaments: [],
          golferUsage: [],
          chalkScore: 0,
          chalkLabel: 'Balanced',
        });
      }

      const player = playerMap.get(entry.entryName)!;
      const adjustedPoints = calculateAdjustedPoints(entry.points, t.multiplier);
      const { cutsMade, totalGolfers } = parseTimeRemaining(entry.timeRemaining, t.currentRound);

      player.tournaments.push({
        tournamentId: t.id,
        tournamentName: t.name,
        shortName: t.shortName,
        isMajor: t.isMajor,
        multiplier: t.multiplier,
        rank: entry.rank,
        points: entry.points,
        adjustedPoints,
        lineup: entry.lineup,
        payout: entry.payout,
        cutsMade,
        totalGolfers,
        status: t.status,
        currentRound: t.currentRound,
      });

      player.totalPoints += adjustedPoints;
      player.totalEarnings += entry.payout;
    }
  }

  // Add DNS entries for players who missed tournaments
  const allHandles = Array.from(playerMap.keys());
  for (const td of allTournamentData) {
    if (td.tournament.status === 'upcoming') continue;
    const entryNames = new Set(td.entries.map(e => e.entryName));
    for (const handle of allHandles) {
      if (!entryNames.has(handle)) {
        const player = playerMap.get(handle)!;
        player.tournaments.push({
          tournamentId: td.tournament.id,
          tournamentName: td.tournament.name,
          shortName: td.tournament.shortName,
          isMajor: td.tournament.isMajor,
          multiplier: td.tournament.multiplier,
          rank: 0,
          points: 0,
          adjustedPoints: 0,
          lineup: [],
          payout: 0,
          cutsMade: 0,
          totalGolfers: 0,
          status: 'completed',
          currentRound: td.tournament.currentRound,
        });
      }
    }
  }

  // Build golfer usage and chalk analysis
  for (const player of playerMap.values()) {
    player.golferUsage = buildGolferUsage(player.tournaments);

    // Aggregate chalk analysis across all tournaments
    let totalChalk = 0;
    let totalContrarian = 0;
    let tournamentCount = 0;
    for (const td of allTournamentData) {
      const playerTournament = player.tournaments.find(pt => pt.tournamentId === td.tournament.id);
      if (playerTournament && playerTournament.lineup.length > 0) {
        const analysis = analyzeChalkVsContrarian(playerTournament.lineup, td.ownership);
        totalChalk += analysis.chalkCount;
        totalContrarian += analysis.contrarianCount;
        tournamentCount++;
      }
    }
    if (tournamentCount > 0) {
      const avgChalk = totalChalk / tournamentCount;
      const avgContrarian = totalContrarian / tournamentCount;
      player.chalkScore = avgChalk;
      if (avgChalk >= 4) player.chalkLabel = 'Heavy Chalk';
      else if (avgChalk >= 3) player.chalkLabel = 'Chalk Leaning';
      else if (avgContrarian >= 4) player.chalkLabel = 'Contrarian';
      else if (avgContrarian >= 3) player.chalkLabel = 'Contrarian Leaning';
      else player.chalkLabel = 'Balanced';
    }
  }

  // Sort by total points and assign ranks
  const sorted = Array.from(playerMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  sorted.forEach((p, i) => { p.seasonRank = i + 1; });

  return sorted;
}

export function calculateEventPayouts(entries: Entry[], isMajor: boolean): Entry[] {
  const sorted = [...entries].sort((a, b) => b.points - a.points);
  return sorted.map((entry, i) => {
    let payout = 0;
    if (isMajor) {
      if (i === 0) payout = PAYOUTS.major.first.amount;
      else if (i === 1) payout = PAYOUTS.major.second.amount;
    } else {
      if (i === 0) payout = PAYOUTS.nonMajor.first.amount;
    }
    return { ...entry, payout };
  });
}

export function buildSeasonEarnings(playerSeasons: PlayerSeason[]): SeasonEarningsEntry[] {
  return playerSeasons.map(p => {
    const awards: Award[] = [];
    for (const t of p.tournaments) {
      if (t.payout > 0) {
        awards.push({
          tournamentShortName: t.shortName,
          place: t.rank,
          amount: t.payout,
        });
      }
    }
    return {
      handle: p.handle,
      totalEarnings: p.totalEarnings,
      seasonRank: p.seasonRank,
      awards,
    };
  }).sort((a, b) => b.totalEarnings - a.totalEarnings);
}

export function parseCSVData(csvText: string): { entries: Entry[]; ownership: GolferOwnership[] } {
  const lines = csvText.trim().split('\n');
  const entries: Entry[] = [];
  const ownership: GolferOwnership[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    // Left side: Rank, EntryId, EntryName, TimeRemaining, Points, Lineup
    const rank = parseInt(parts[0]);
    const entryId = parts[1];
    const entryName = parts[2];
    const timeRemaining = parseInt(parts[3]);
    const points = parseFloat(parts[4]);
    const lineupStr = parts[5];

    if (entryName && !isNaN(rank)) {
      const lineup = lineupStr
        .replace(/^G\s+/, '')
        .split(/\s+G\s+/)
        .map(g => g.trim())
        .filter(Boolean);

      entries.push({
        rank,
        entryId,
        entryName,
        timeRemaining,
        points,
        lineup,
        payout: 0,
      });
    }

    // Right side: empty, empty, Player, Roster Position, %Drafted, FPTS
    const golferName = parts[7];
    const rosterPosition = parts[8];
    const pctDrafted = parseFloat(parts[9]?.replace('%', ''));
    const fpts = parseFloat(parts[10]);

    if (golferName && !isNaN(pctDrafted)) {
      ownership.push({ golferName, rosterPosition, pctDrafted, fpts });
    }
  }

  return { entries, ownership };
}
