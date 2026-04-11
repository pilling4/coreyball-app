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

  // A golfer is cut if after Round 2+, they have fewer completed rounds than the leaders
  const isCut = maxRounds >= 3 && completedRounds <= 2 && completedRounds < maxRounds;

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

    // Build a lookup: golfer name -> live data
    const allGolfers: Record<string, GolferLiveData> = {};
    for (const c of competitors) {
      const parsed = parseCompetitor(c, maxRounds);
      allGolfers[parsed.name] = parsed;
    }

    // If specific golfers requested, filter to just those
    let result: Record<string, GolferLiveData>;
    if (golferNames) {
      const requested = golferNames.split(',').map((n) => n.trim());
      result = {};
      for (const name of requested) {
        // Try exact match first, then fuzzy (last name)
        if (allGolfers[name]) {
          result[name] = allGolfers[name];
        } else {
          const lastName = name.split(' ').pop()?.toLowerCase();
          const match = Object.entries(allGolfers).find(([n]) =>
            n.toLowerCase().includes(lastName || '')
          );
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
