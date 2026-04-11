// ESPN integration for PGA golfer headshots and live scoring data

const HEADSHOT_CACHE: Record<string, string> = {};
const FALLBACK_HEADSHOT = '';

// Known ESPN athlete IDs for commonly rostered golfers
const KNOWN_IDS: Record<string, number> = {
  'Scottie Scheffler': 9270,
  'Xander Schauffele': 10423,
  'Bryson DeChambeau': 10046,
  'Jon Rahm': 9780,
  'Ludvig Aberg': 4871718,
  'Brooks Koepka': 6798,
  'Matt Fitzpatrick': 9037,
  'Patrick Reed': 6493,
  'Justin Rose': 1225,
  'Adam Scott': 380,
  'Jordan Spieth': 9131,
  'Cameron Young': 4374067,
  'Cameron Smith': 9268,
  'Hideki Matsuyama': 5765,
  'Viktor Hovland': 4364873,
  'Tommy Fleetwood': 6144,
  'Shane Lowry': 3448,
  'Dustin Johnson': 3702,
  'Justin Thomas': 9917,
  'Jason Day': 1680,
  'Akshay Bhatia': 4685506,
  'Chris Gotterup': 4697461,
  'Tyrrell Hatton': 9261,
  'Corey Conners': 10404,
  'Robert MacIntyre': 4686087,
  'Patrick Cantlay': 9404,
  'Sam Burns': 4374400,
  'Min Woo Lee': 4686156,
  'Jacob Bridgeman': 4697456,
  'Harris English': 5765,
  'Russell Henley': 6659,
  'Si Woo Kim': 9701,
  'Brian Harman': 6702,
  'Jake Knapp': 4685859,
  'Nicolai Hojgaard': 4686095,
  'Daniel Berger': 9609,
  'Sepp Straka': 10500,
  'Maverick McNealy': 10416,
  'Gary Woodland': 3339,
  'Sam Stevens': 4697482,
  'Alex Noren': 3832,
  'Kurt Kitayama': 10422,
  'Tom McKibbin': 4873850,
  'Sungjae Im': 4382405,
  'Matthew McCarty': 4873842,
  'Carlos Ortiz': 6906,
  'Michael Kim': 10037,
  'J.J. Spaun': 9527,
};

function getEspnHeadshotUrl(athleteId: number): string {
  if (!athleteId) return FALLBACK_HEADSHOT;
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/golf/players/full/${athleteId}.png&w=96&h=70&cb=1`;
}

export function getGolferHeadshot(golferName: string): string {
  if (HEADSHOT_CACHE[golferName]) return HEADSHOT_CACHE[golferName];

  const knownId = KNOWN_IDS[golferName];
  if (knownId) {
    const url = getEspnHeadshotUrl(knownId);
    HEADSHOT_CACHE[golferName] = url;
    return url;
  }

  return FALLBACK_HEADSHOT;
}

// Update cache with ESPN API data (called after API fetch)
export function updateHeadshotCache(golferData: Record<string, { headshot: string }>) {
  for (const [name, data] of Object.entries(golferData)) {
    if (data.headshot) {
      HEADSHOT_CACHE[name] = data.headshot;
    }
  }
}

export interface GolferLiveData {
  espnId: string;
  name: string;
  score: string;
  roundScore: string;
  headshot: string;
  country: string;
  countryFlag: string;
  isCut: boolean;
}

export interface ESPNResponse {
  tournament: { id: string; name: string } | null;
  golfers: Record<string, GolferLiveData>;
}

// Fetch live data for specific golfers from our API route
export async function fetchGolferLiveData(golferNames: string[]): Promise<ESPNResponse> {
  try {
    const params = new URLSearchParams({ golfers: golferNames.join(',') });
    const res = await fetch(`/api/espn?${params}`);
    if (!res.ok) throw new Error('API error');
    const data: ESPNResponse = await res.json();

    // Update headshot cache with any new data from ESPN
    updateHeadshotCache(data.golfers);

    return data;
  } catch {
    return { tournament: null, golfers: {} };
  }
}
