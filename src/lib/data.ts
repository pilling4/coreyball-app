import { TournamentData, Entry, GolferOwnership } from './types';
import { TOURNAMENTS } from './constants';
import { supabase, isSupabaseConfigured } from './supabase';
import { calculateEventPayouts } from './utils';

// ============================================================
// Masters 2026 - Round 1 Seed Data
// ============================================================

const MASTERS_ENTRIES_RAW: Omit<Entry, 'payout'>[] = [
  { rank: 1, entryId: '5108034230', entryName: 'nole91', timeRemaining: 324, points: 149, lineup: ['Bryson DeChambeau','Patrick Reed','Matt Fitzpatrick','Akshay Bhatia','Adam Scott','Kurt Kitayama'] },
  { rank: 2, entryId: '5106539721', entryName: 'jtanis31', timeRemaining: 324, points: 147.5, lineup: ['Bryson DeChambeau','Patrick Reed','Russell Henley','Akshay Bhatia','Jason Day','Adam Scott'] },
  { rank: 3, entryId: '5106842779', entryName: 'charlier4211', timeRemaining: 324, points: 142, lineup: ['Xander Schauffele','Justin Rose','Patrick Reed','Min Woo Lee','Jacob Bridgeman','J.J. Spaun'] },
  { rank: 4, entryId: '5108907979', entryName: 'DBuzz803', timeRemaining: 324, points: 138, lineup: ['Cameron Young','Justin Rose','Patrick Reed','Tyrrell Hatton','Adam Scott','Jake Knapp'] },
  { rank: 5, entryId: '5106701656', entryName: 'rmyoung13', timeRemaining: 324, points: 136, lineup: ['Jon Rahm','Xander Schauffele','Patrick Reed','Corey Conners','Harris English','Sam Stevens'] },
  { rank: 6, entryId: '5109583782', entryName: 'brij34', timeRemaining: 324, points: 133, lineup: ['Bryson DeChambeau','Ludvig Aberg','Brooks Koepka','Jason Day','Alex Noren','Kurt Kitayama'] },
  { rank: 7, entryId: '5106973461', entryName: 'JoeRase24', timeRemaining: 324, points: 130, lineup: ['Ludvig Aberg','Xander Schauffele','Shane Lowry','Chris Gotterup','Daniel Berger','Gary Woodland'] },
  { rank: 8, entryId: '5106908722', entryName: 'alexmccarthy58', timeRemaining: 324, points: 120.5, lineup: ['Xander Schauffele','Tommy Fleetwood','Chris Gotterup','Akshay Bhatia','Si Woo Kim','Nicolai Hojgaard'] },
  { rank: 9, entryId: '5109384367', entryName: 'cmcgreal', timeRemaining: 324, points: 120, lineup: ['Xander Schauffele','Viktor Hovland','Matt Fitzpatrick','Akshay Bhatia','Jason Day','Nicolai Hojgaard'] },
  { rank: 10, entryId: '5107990999', entryName: 'Kevin2181', timeRemaining: 324, points: 117, lineup: ['Bryson DeChambeau','Justin Rose','Hideki Matsuyama','Tyrrell Hatton','Jason Day','Ethan Fang'] },
  { rank: 11, entryId: '5107212665', entryName: 'WesMemphis', timeRemaining: 324, points: 116, lineup: ['Cameron Young','Patrick Reed','Matt Fitzpatrick','Chris Gotterup','Min Woo Lee','Jacob Bridgeman'] },
  { rank: 11, entryId: '5109346487', entryName: 'TheReccles', timeRemaining: 324, points: 116, lineup: ['Xander Schauffele','Hideki Matsuyama','Matt Fitzpatrick','Chris Gotterup','Jacob Bridgeman','Jake Knapp'] },
  { rank: 13, entryId: '5107680474', entryName: 'parkertaylor2', timeRemaining: 324, points: 115, lineup: ['Ludvig Aberg','Patrick Reed','Hideki Matsuyama','Akshay Bhatia','Daniel Berger','Jake Knapp'] },
  { rank: 14, entryId: '5107866591', entryName: 'jimmymcwhorter14', timeRemaining: 324, points: 114.5, lineup: ['Scottie Scheffler','Jacob Bridgeman','Harris English','Brian Harman','Jake Knapp','Gary Woodland'] },
  { rank: 15, entryId: '5107446394', entryName: 'stevencurry11', timeRemaining: 324, points: 113, lineup: ['Bryson DeChambeau','Justin Rose','Tyrrell Hatton','Akshay Bhatia','Jason Day','Daniel Berger'] },
  { rank: 16, entryId: '5108440279', entryName: 'UKColetrain8', timeRemaining: 324, points: 110, lineup: ['Jon Rahm','Xander Schauffele','Jordan Spieth','Jacob Bridgeman','Adam Scott','J.J. Spaun'] },
  { rank: 17, entryId: '5106615510', entryName: 'slurpking', timeRemaining: 324, points: 105.5, lineup: ['Ludvig Aberg','Xander Schauffele','Akshay Bhatia','Min Woo Lee','Jacob Bridgeman','Jake Knapp'] },
  { rank: 17, entryId: '5107373995', entryName: 'MasonMcWhorter', timeRemaining: 324, points: 105.5, lineup: ['Bryson DeChambeau','Ludvig Aberg','Chris Gotterup','Adam Scott','Jake Knapp','Gary Woodland'] },
  { rank: 19, entryId: '5107328218', entryName: 'wright_gh', timeRemaining: 324, points: 103.5, lineup: ['Bryson DeChambeau','Tommy Fleetwood','Matt Fitzpatrick','Russell Henley','Sam Stevens','Jake Knapp'] },
  { rank: 20, entryId: '5108621472', entryName: 'jadam.young1982', timeRemaining: 324, points: 103, lineup: ['Bryson DeChambeau','Ludvig Aberg','Tyrrell Hatton','Min Woo Lee','Sam Burns','Carlos Ortiz'] },
  { rank: 21, entryId: '5107402675', entryName: 'MrSillyRabbit22', timeRemaining: 324, points: 102.5, lineup: ['Jon Rahm','Viktor Hovland','Justin Thomas','Patrick Cantlay','Cameron Smith','Sam Burns'] },
  { rank: 21, entryId: '5109122067', entryName: 'hstiles', timeRemaining: 324, points: 102.5, lineup: ['Bryson DeChambeau','Brooks Koepka','Jordan Spieth','Akshay Bhatia','Cameron Smith','Harris English'] },
  { rank: 23, entryId: '5109359668', entryName: 'HunterMcDallas', timeRemaining: 324, points: 102, lineup: ['Bryson DeChambeau','Justin Rose','Jordan Spieth','Akshay Bhatia','Dustin Johnson','Nicolai Hojgaard'] },
  { rank: 23, entryId: '5109376966', entryName: 'mdswan40', timeRemaining: 324, points: 102, lineup: ['Ludvig Aberg','Xander Schauffele','Robert MacIntyre','Adam Scott','J.J. Spaun','Nicolai Hojgaard'] },
  { rank: 25, entryId: '5106739206', entryName: 'mlangley2010', timeRemaining: 324, points: 100.5, lineup: ['Xander Schauffele','Cameron Young','Matt Fitzpatrick','Chris Gotterup','Russell Henley','Brian Harman'] },
  { rank: 26, entryId: '5106957323', entryName: 'Rase32', timeRemaining: 324, points: 99, lineup: ['Xander Schauffele','Matt Fitzpatrick','Jordan Spieth','Sepp Straka','Si Woo Kim','Nicolai Hojgaard'] },
  { rank: 27, entryId: '5108089379', entryName: 'ToddPerdont', timeRemaining: 324, points: 97.5, lineup: ['Ludvig Aberg','Tommy Fleetwood','Matt Fitzpatrick','Corey Conners','Harris English','Maverick McNealy'] },
  { rank: 28, entryId: '5108683315', entryName: 'sworthy18', timeRemaining: 324, points: 95.5, lineup: ['Ludvig Aberg','Xander Schauffele','Cameron Young','Min Woo Lee','Adam Scott','Brian Harman'] },
  { rank: 29, entryId: '5108723441', entryName: 'michaelearle', timeRemaining: 324, points: 95, lineup: ['Cameron Young','Hideki Matsuyama','Matt Fitzpatrick','Robert MacIntyre','Harris English','Adam Scott'] },
  { rank: 30, entryId: '5106997577', entryName: 'jbreeding321', timeRemaining: 324, points: 91.5, lineup: ['Jon Rahm','Xander Schauffele','Matt Fitzpatrick','Corey Conners','Cameron Smith','Matthew McCarty'] },
  { rank: 30, entryId: '5107923404', entryName: 'JoeClass81', timeRemaining: 324, points: 91.5, lineup: ['Ludvig Aberg','Xander Schauffele','Robert MacIntyre','Chris Gotterup','Brian Harman','Nicolai Hojgaard'] },
  { rank: 32, entryId: '5106985398', entryName: 'mikemathias5', timeRemaining: 324, points: 89, lineup: ['Xander Schauffele','Viktor Hovland','Robert MacIntyre','Patrick Cantlay','Corey Conners','Adam Scott'] },
  { rank: 33, entryId: '5107930358', entryName: 'CoreyMinaj', timeRemaining: 324, points: 88.5, lineup: ['Bryson DeChambeau','Cameron Young','Justin Rose','Min Woo Lee','Adam Scott','Carlos Ortiz'] },
  { rank: 33, entryId: '5109413613', entryName: 'trent1022', timeRemaining: 324, points: 88.5, lineup: ['Bryson DeChambeau','Matt Fitzpatrick','Justin Thomas','Tyrrell Hatton','Cameron Smith','Adam Scott'] },
  { rank: 35, entryId: '5109204715', entryName: 'bmarbut12', timeRemaining: 324, points: 86.5, lineup: ['Jon Rahm','Tommy Fleetwood','Matt Fitzpatrick','Min Woo Lee','Corey Conners','Sam Stevens'] },
  { rank: 35, entryId: '5109383171', entryName: 'bdenn574', timeRemaining: 324, points: 86.5, lineup: ['Ludvig Aberg','Matt Fitzpatrick','Robert MacIntyre','Akshay Bhatia','Si Woo Kim','Adam Scott'] },
  { rank: 37, entryId: '5109289770', entryName: 'pilling4', timeRemaining: 324, points: 85.5, lineup: ['Ludvig Aberg','Matt Fitzpatrick','Robert MacIntyre','Jordan Spieth','Russell Henley','Matthew McCarty'] },
  { rank: 38, entryId: '5109374099', entryName: 'azzicole', timeRemaining: 324, points: 85, lineup: ['Jon Rahm','Matt Fitzpatrick','Robert MacIntyre','Akshay Bhatia','Jacob Bridgeman','Adam Scott'] },
  { rank: 39, entryId: '5106601670', entryName: 'Desert_Swarm', timeRemaining: 324, points: 81, lineup: ['Cameron Young','Hideki Matsuyama','Matt Fitzpatrick','Si Woo Kim','Min Woo Lee','Jacob Bridgeman'] },
  { rank: 40, entryId: '5108527336', entryName: 'mikechil', timeRemaining: 324, points: 79, lineup: ['Jon Rahm','Cameron Young','Jordan Spieth','Akshay Bhatia','Corey Conners','Michael Kim'] },
  { rank: 41, entryId: '5109513726', entryName: 'Turner2_ATM', timeRemaining: 324, points: 78, lineup: ['Jon Rahm','Ludvig Aberg','Min Woo Lee','Corey Conners','Cameron Smith','Adam Scott'] },
  { rank: 42, entryId: '5109328597', entryName: 'meadows381', timeRemaining: 324, points: 76, lineup: ['Bryson DeChambeau','Viktor Hovland','Jordan Spieth','Sepp Straka','Corey Conners','Tom McKibbin'] },
  { rank: 43, entryId: '5106929470', entryName: 'Hberg25', timeRemaining: 324, points: 74.5, lineup: ['Jon Rahm','Matt Fitzpatrick','Tyrrell Hatton','Chris Gotterup','Min Woo Lee','Jacob Bridgeman'] },
  { rank: 44, entryId: '5107159737', entryName: 'bwrightnotwrong', timeRemaining: 324, points: 71.5, lineup: ['Bryson DeChambeau','Matt Fitzpatrick','Robert MacIntyre','Si Woo Kim','Jacob Bridgeman','J.J. Spaun'] },
  { rank: 45, entryId: '5109390999', entryName: 'bbronosky1', timeRemaining: 324, points: 70, lineup: ['Bryson DeChambeau','Matt Fitzpatrick','Russell Henley','Akshay Bhatia','Sungjae Im','Daniel Berger'] },
  { rank: 46, entryId: '5106617136', entryName: 'mjgpkg86', timeRemaining: 324, points: 66, lineup: ['Jon Rahm','Matt Fitzpatrick','Chris Gotterup','Si Woo Kim','Min Woo Lee','Jake Knapp'] },
  { rank: 47, entryId: '5109197894', entryName: 'Jpstang350', timeRemaining: 324, points: 65, lineup: ['Jon Rahm','Xander Schauffele','Matt Fitzpatrick','Si Woo Kim','Maverick McNealy','Rasmus Neergaard-Petersen'] },
  { rank: 48, entryId: '5106937244', entryName: 't5e5carroll', timeRemaining: 324, points: 60, lineup: ['Bryson DeChambeau','Jon Rahm','Matt Fitzpatrick','Dustin Johnson','Michael Kim','Jake Knapp'] },
];

const MASTERS_OWNERSHIP: GolferOwnership[] = [
  { golferName: 'Matt Fitzpatrick', rosterPosition: 'G', pctDrafted: 45.83, fpts: 12.5 },
  { golferName: 'Bryson DeChambeau', rosterPosition: 'G', pctDrafted: 33.33, fpts: 9.5 },
  { golferName: 'Xander Schauffele', rosterPosition: 'G', pctDrafted: 33.33, fpts: 30.5 },
  { golferName: 'Adam Scott', rosterPosition: 'G', pctDrafted: 29.17, fpts: 24 },
  { golferName: 'Akshay Bhatia', rosterPosition: 'G', pctDrafted: 27.08, fpts: 18 },
  { golferName: 'Ludvig Aberg', rosterPosition: 'G', pctDrafted: 27.08, fpts: 16 },
  { golferName: 'Jon Rahm', rosterPosition: 'G', pctDrafted: 25.00, fpts: 3.5 },
  { golferName: 'Min Woo Lee', rosterPosition: 'G', pctDrafted: 22.92, fpts: 5 },
  { golferName: 'Jacob Bridgeman', rosterPosition: 'G', pctDrafted: 20.83, fpts: 21.5 },
  { golferName: 'Jake Knapp', rosterPosition: 'G', pctDrafted: 18.75, fpts: 14.5 },
  { golferName: 'Chris Gotterup', rosterPosition: 'G', pctDrafted: 18.75, fpts: 20 },
  { golferName: 'Cameron Young', rosterPosition: 'G', pctDrafted: 16.67, fpts: 14.5 },
  { golferName: 'Corey Conners', rosterPosition: 'G', pctDrafted: 16.67, fpts: 16 },
  { golferName: 'Robert MacIntyre', rosterPosition: 'G', pctDrafted: 16.67, fpts: 5.5 },
  { golferName: 'Patrick Reed', rosterPosition: 'G', pctDrafted: 14.58, fpts: 42.5 },
  { golferName: 'Si Woo Kim', rosterPosition: 'G', pctDrafted: 14.58, fpts: 10.5 },
  { golferName: 'Jordan Spieth', rosterPosition: 'G', pctDrafted: 14.58, fpts: 18.5 },
  { golferName: 'Justin Rose', rosterPosition: 'G', pctDrafted: 12.50, fpts: 30.5 },
  { golferName: 'Nicolai Hojgaard', rosterPosition: 'G', pctDrafted: 12.50, fpts: 14 },
  { golferName: 'Tyrrell Hatton', rosterPosition: 'G', pctDrafted: 12.50, fpts: 12 },
  { golferName: 'Russell Henley', rosterPosition: 'G', pctDrafted: 10.42, fpts: 17.5 },
  { golferName: 'Jason Day', rosterPosition: 'G', pctDrafted: 10.42, fpts: 36 },
  { golferName: 'Hideki Matsuyama', rosterPosition: 'G', pctDrafted: 10.42, fpts: 17 },
  { golferName: 'Harris English', rosterPosition: 'G', pctDrafted: 10.42, fpts: 21.5 },
  { golferName: 'Cameron Smith', rosterPosition: 'G', pctDrafted: 10.42, fpts: 13.5 },
  { golferName: 'Brian Harman', rosterPosition: 'G', pctDrafted: 8.33, fpts: 5.5 },
  { golferName: 'J.J. Spaun', rosterPosition: 'G', pctDrafted: 8.33, fpts: 12 },
  { golferName: 'Tommy Fleetwood', rosterPosition: 'G', pctDrafted: 8.33, fpts: 27.5 },
  { golferName: 'Daniel Berger', rosterPosition: 'G', pctDrafted: 8.33, fpts: 7 },
  { golferName: 'Viktor Hovland', rosterPosition: 'G', pctDrafted: 8.33, fpts: 9 },
  { golferName: 'Sam Stevens', rosterPosition: 'G', pctDrafted: 6.25, fpts: 22 },
  { golferName: 'Gary Woodland', rosterPosition: 'G', pctDrafted: 6.25, fpts: 21.5 },
  { golferName: 'Dustin Johnson', rosterPosition: 'G', pctDrafted: 4.17, fpts: 11.5 },
  { golferName: 'Michael Kim', rosterPosition: 'G', pctDrafted: 4.17, fpts: 8.5 },
  { golferName: 'Sepp Straka', rosterPosition: 'G', pctDrafted: 4.17, fpts: 13 },
  { golferName: 'Patrick Cantlay', rosterPosition: 'G', pctDrafted: 4.17, fpts: 4 },
  { golferName: 'Matthew McCarty', rosterPosition: 'G', pctDrafted: 4.17, fpts: 15.5 },
  { golferName: 'Justin Thomas', rosterPosition: 'G', pctDrafted: 4.17, fpts: 17 },
  { golferName: 'Sam Burns', rosterPosition: 'G', pctDrafted: 4.17, fpts: 55.5 },
  { golferName: 'Carlos Ortiz', rosterPosition: 'G', pctDrafted: 4.17, fpts: 5 },
  { golferName: 'Kurt Kitayama', rosterPosition: 'G', pctDrafted: 4.17, fpts: 42.5 },
  { golferName: 'Maverick McNealy', rosterPosition: 'G', pctDrafted: 4.17, fpts: 4 },
  { golferName: 'Brooks Koepka', rosterPosition: 'G', pctDrafted: 4.17, fpts: 21.5 },
  { golferName: 'Shane Lowry', rosterPosition: 'G', pctDrafted: 2.08, fpts: 35 },
  { golferName: 'Scottie Scheffler', rosterPosition: 'G', pctDrafted: 2.08, fpts: 30 },
  { golferName: 'Ethan Fang', rosterPosition: 'G', pctDrafted: 2.08, fpts: 12 },
  { golferName: 'Rasmus Neergaard-Petersen', rosterPosition: 'G', pctDrafted: 2.08, fpts: 4 },
  { golferName: 'Tom McKibbin', rosterPosition: 'G', pctDrafted: 2.08, fpts: 10 },
  { golferName: 'Sungjae Im', rosterPosition: 'G', pctDrafted: 2.08, fpts: 5.5 },
  { golferName: 'Alex Noren', rosterPosition: 'G', pctDrafted: 2.08, fpts: 7.5 },
];

// Build seed data with payouts calculated
const mastersTournament = TOURNAMENTS.find(t => t.id === 'masters-2026')!;
const mastersEntriesWithPayouts = calculateEventPayouts(
  MASTERS_ENTRIES_RAW.map(e => ({ ...e, payout: 0 })),
  mastersTournament.isMajor
);

const SEED_DATA: Record<string, TournamentData> = {
  'masters-2026': {
    tournament: mastersTournament,
    entries: mastersEntriesWithPayouts,
    ownership: MASTERS_OWNERSHIP,
  },
};

// ============================================================
// Data Fetching Functions
// ============================================================

export async function getTournamentData(tournamentId: string): Promise<TournamentData | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data: tournament } = await supabase!
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      const { data: entries } = await supabase!
        .from('entries')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('rank', { ascending: true });

      const { data: ownership } = await supabase!
        .from('golfer_ownership')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('pct_drafted', { ascending: false });

      if (tournament && entries) {
        return {
          tournament: {
            id: tournament.id,
            name: tournament.name,
            shortName: tournament.short_name,
            slug: tournament.slug,
            startDate: tournament.start_date,
            endDate: tournament.end_date,
            isMajor: tournament.is_major,
            multiplier: tournament.multiplier,
            status: tournament.status,
            currentRound: tournament.current_round,
            updatedAt: tournament.updated_at,
          },
          entries: entries.map((e: Record<string, unknown>) => ({
            rank: e.rank as number,
            entryId: e.entry_id as string,
            entryName: e.entry_name as string,
            timeRemaining: e.time_remaining as number,
            points: e.points as number,
            lineup: e.lineup as string[],
            payout: (e.payout as number) || 0,
          })),
          ownership: (ownership || []).map((o: Record<string, unknown>) => ({
            golferName: o.golfer_name as string,
            rosterPosition: o.roster_position as string,
            pctDrafted: o.pct_drafted as number,
            fpts: o.fpts as number,
          })),
        };
      }
    } catch (err) {
      console.error('Supabase fetch error:', err);
    }
  }

  // Fallback to seed data
  return SEED_DATA[tournamentId] || null;
}

export async function getAllTournamentData(): Promise<TournamentData[]> {
  if (isSupabaseConfigured()) {
    try {
      // Find which tournaments actually have entries uploaded
      const { data: tournamentIds } = await supabase!
        .from('entries')
        .select('tournament_id')
        .limit(1000);

      if (tournamentIds) {
        const uniqueIds = [...new Set(tournamentIds.map((r: Record<string, unknown>) => r.tournament_id as string))];
        const results: TournamentData[] = [];
        for (const id of uniqueIds) {
          const data = await getTournamentData(id);
          if (data) results.push(data);
        }
        return results;
      }
    } catch (err) {
      console.error('Failed to list tournaments with data:', err);
    }
  }

  // Fallback: return seed data
  return Object.values(SEED_DATA);
}

export function getSeedData(): Record<string, TournamentData> {
  return SEED_DATA;
}

// Fetch live tournament metadata from Supabase to override constants
export async function getLiveTournaments(): Promise<import('./types').Tournament[]> {
  if (!isSupabaseConfigured()) return TOURNAMENTS;

  try {
    const { data } = await supabase!
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true });

    if (data && data.length > 0) {
      return data.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        shortName: t.short_name as string,
        slug: t.slug as string,
        startDate: t.start_date as string,
        endDate: t.end_date as string,
        isMajor: t.is_major as boolean,
        multiplier: Number(t.multiplier),
        status: t.status as 'upcoming' | 'in_progress' | 'completed',
        currentRound: t.current_round as number,
        updatedAt: (t.updated_at as string) || '',
      }));
    }
  } catch (err) {
    console.error('Failed to fetch live tournaments:', err);
  }

  return TOURNAMENTS;
}
