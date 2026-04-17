export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  startDate: string;
  endDate: string;
  isMajor: boolean;
  multiplier: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  currentRound: number;
  updatedAt: string;
}

export interface Entry {
  rank: number;
  entryId: string;
  entryName: string;
  timeRemaining: number;
  points: number;
  lineup: string[];
  payout: number;
}

export interface GolferOwnership {
  golferName: string;
  rosterPosition: string;
  pctDrafted: number;
  fpts: number;
}

export interface TournamentData {
  tournament: Tournament;
  entries: Entry[];
  ownership: GolferOwnership[];
}

export interface PlayerSeason {
  handle: string;
  totalPoints: number;
  totalEarnings: number;
  seasonRank: number;
  tournaments: PlayerTournamentResult[];
  golferUsage: GolferUsage[];
  chalkScore: number;
  chalkLabel: string;
}

export interface PlayerTournamentResult {
  tournamentId: string;
  tournamentName: string;
  shortName: string;
  isMajor: boolean;
  multiplier: number;
  rank: number;
  points: number;
  adjustedPoints: number;
  lineup: string[];
  payout: number;
  cutsMade: number;
  totalGolfers: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  currentRound: number;
}

export interface GolferUsage {
  golferName: string;
  timesUsed: number;
  tournamentsPlayed: number;
  tournaments: string[];
}

export interface SeasonEarningsEntry {
  handle: string;
  totalEarnings: number;
  seasonRank: number;
  awards: Award[];
}

export interface Award {
  tournamentShortName: string;
  place: number;
  amount: number;
}
