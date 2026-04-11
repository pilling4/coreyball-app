import { type NextRequest } from 'next/server';

const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';

// Revalidate every 5 minutes during tournaments
export const revalidate = 300;

interface ESPNAthlete {
  fullName: string;
  displayName: string;
  shortName: string;
  flag?: { href: string; alt: string };
}

interface ESPNLineScore {
  value: number;
  displayValue: string;
  period: number;
}

interface ESPNCompetitor {
  id: string;
  uid: string;
  order: number;
  score: string;
  status?: { displayValue?: string; type?: { abbreviation?: string } };
  athlete: ESPNAthlete;
  linescores?: ESPNLineScore[];
}

interface ESPNEvent {
  id: string;
  name: string;
  shortName?: string;
  competitions: {
    competitors: ESPNCompetitor[];
  }[];
}

export interface GolferLiveData {
  espnId: string;
  name: string;
  score: string; // to par, e.g. "-5", "E", "+3"
  roundScore: string; // current/latest round score
  headshot: string;
  country: string;
  countryFlag: string;
  isCut: boolean;
}

/** Strip diacritics/accents: å→a, ü→u, ñ→n, etc. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getHeadshotUrl(espnId: string): string {
  if (!espnId || espnId === '0') return '';
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/golf/players/full/${espnId}.png&w=96&h=70&cb=1`;
}

function getCompletedRounds(c: ESPNCompetitor): number {
  if (!c.linescores) return 0;
  return c.linescores.filter(ls => ls.displayValue && ls.displayValue !== '-').length;
}

function parseCompetitor(c: ESPNCompetitor, maxRounds: number): GolferLiveData {
  const completedRounds = getCompletedRounds(c);
  const latestRound = c.linescores
    ?.filter((ls) => ls.displayValue !== '-')
    .pop();

  // Multiple ways to detect a cut:
  // 1. ESPN status field says "cut"
  const statusAbbr = (c.status?.type?.abbreviation || '').toLowerCase();
  const statusDisplay = (c.status?.displayValue || '').toLowerCase();
  const espnSaysCut = statusAbbr === 'cut' || statusDisplay.includes('cut') || (c.score || '').toUpperCase() === 'CUT';
  // 2. After Round 2, they have fewer completed rounds than the leaders
  const roundBasedCut = maxRounds >= 3 && completedRounds <= 2 && completedRounds < maxRounds;

  const isCut = espnSaysCut || roundBasedCut;

  return {
    espnId: c.id,
    name: c.athlete.fullName,
    score: isCut ? 'CUT' : (c.score || 'E'),
    roundScore: latestRound?.displayValue || '-',
    headshot: getHeadshotUrl(c.id),
    country: c.athlete.flag?.alt || '',
    countryFlag: c.athlete.flag?.href || '',
    isCut,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const golferNames = searchParams.get('golfers'); // comma-separated

  try {
    const res = await fetch(ESPN_SCOREBOARD_URL, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return Response.json(
        { error: 'ESPN API unavailable' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const event: ESPNEvent | undefined = data.events?.[0];

    if (!event || !event.competitions?.[0]?.competitors) {
      return Response.json({
        tournament: null,
        golfers: {},
      });
    }

    const competitors = event.competitions[0].competitors;

    // Determine max completed rounds across all competitors
    const maxRounds = Math.max(...competitors.map(c => getCompletedRounds(c)), 0);

    // Build lookups: exact name -> data AND normalized name -> data
    const allGolfers: Record<string, GolferLiveData> = {};
    const normalizedLookup: Record<string, GolferLiveData> = {};
    for (const c of competitors) {
      const parsed = parseCompetitor(c, maxRounds);
      allGolfers[parsed.name] = parsed;
      normalizedLookup[normalize(parsed.name)] = parsed;
    }

    // If specific golfers requested, filter to just those
    let result: Record<string, GolferLiveData>;
    if (golferNames) {
      const requested = golferNames.split(',').map((n) => n.trim());
      result = {};
      for (const name of requested) {
        // Try exact match first
        if (allGolfers[name]) {
          result[name] = allGolfers[name];
        } else if (normalizedLookup[normalize(name)]) {
          // Normalized match (strips diacritics: Åberg → aberg)
          result[name] = normalizedLookup[normalize(name)];
        } else {
          // Fuzzy match: normalized last name + first 3 chars of first name
          const nameParts = normalize(name).split(' ');
          const lastName = nameParts[nameParts.length - 1];
          const firstName = nameParts[0];
          const match = Object.entries(allGolfers).find(([n]) => {
            const parts = normalize(n).split(' ');
            const eLast = parts[parts.length - 1];
            const eFirst = parts[0];
            return eLast === lastName && eFirst.startsWith(firstName.slice(0, 3));
          });
          if (match) {
            result[name] = match[1];
          }
        }
      }
    } else {
      result = allGolfers;
    }

    return Response.json({
      tournament: {
        id: event.id,
        name: event.name,
      },
      golfers: result,
    });
  } catch (err) {
    return Response.json(
      { error: `Failed to fetch ESPN data: ${err}` },
      { status: 500 }
    );
  }
}
