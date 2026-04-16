'use client';

import { useState } from 'react';
import { TOURNAMENTS } from '@/lib/constants';
import { parseCSVData, calculateEventPayouts } from '@/lib/utils';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const ADMIN_PASSWORD = 'coreyball2026';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(TOURNAMENTS[0].id);
  const [currentRound, setCurrentRound] = useState(0); // 0 = pre-round ownership only
  const [csvText, setCsvText] = useState('');
  const [status, setStatus] = useState<'idle' | 'preview' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [previewData, setPreviewData] = useState<ReturnType<typeof parseCSVData> | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setAuthError('Incorrect password');
      setPassword('');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy-900)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-300)' }}>
            Admin Login
          </h1>
          <form onSubmit={handleLogin} className="flex flex-col items-center gap-3">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError(''); }}
              placeholder="Admin password"
              autoFocus
              className="w-64 px-5 py-3 rounded-full text-center text-sm outline-none"
              style={{ background: 'rgba(11, 30, 61, 0.8)', border: '1px solid var(--gold-500)', color: 'var(--gold-300)' }}
            />
            <button
              type="submit"
              className="px-8 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #BFA76A, #D4C089)', color: 'var(--navy-900)' }}
            >
              Enter
            </button>
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
          </form>
          <a href="/dashboard" className="block mt-6 text-sm" style={{ color: 'var(--gold-600)' }}>
            &larr; Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      handlePreview(text);
    };
    reader.readAsText(file);
  };

  const handlePreview = (text?: string) => {
    try {
      const data = parseCSVData(text || csvText);
      const tournament = TOURNAMENTS.find(t => t.id === selectedTournament)!;
      data.entries = calculateEventPayouts(data.entries, tournament.isMajor);
      setPreviewData(data);
      setStatus('preview');
      setMessage(`Parsed ${data.entries.length} entries and ${data.ownership.length} golfers`);
    } catch (err) {
      setStatus('error');
      setMessage(`Parse error: ${err}`);
    }
  };

  const handleUpload = async () => {
    if (!previewData) return;

    if (!isSupabaseConfigured()) {
      setStatus('error');
      setMessage('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
      return;
    }

    setStatus('uploading');
    const tournament = TOURNAMENTS.find(t => t.id === selectedTournament)!;
    const sb = getSupabaseClient()!;

    try {
      const isPreRound = currentRound === 0;

      // Step 1: Upsert tournament metadata
      const { error: tourneyErr } = await sb.from('tournaments').upsert({
        id: tournament.id,
        name: tournament.name,
        short_name: tournament.shortName,
        slug: tournament.slug,
        start_date: tournament.startDate,
        end_date: tournament.endDate,
        is_major: tournament.isMajor,
        multiplier: tournament.multiplier,
        status: isPreRound ? 'in_progress' : currentRound >= 4 ? 'completed' : 'in_progress',
        current_round: isPreRound ? 0 : currentRound,
        updated_at: new Date().toISOString(),
      });
      if (tourneyErr) throw new Error(`Tournament upsert failed: ${tourneyErr.message}`);

      // Step 2: Delete old entries
      const { error: delEntriesErr } = await sb.from('entries').delete().eq('tournament_id', tournament.id);
      if (delEntriesErr) throw new Error(`Delete entries failed: ${delEntriesErr.message}`);

      const { error: delOwnerErr } = await sb.from('golfer_ownership').delete().eq('tournament_id', tournament.id);
      if (delOwnerErr) throw new Error(`Delete ownership failed: ${delOwnerErr.message}`);

      // Step 3: Insert new entries — zero out scores for pre-round uploads
      const entryRows = previewData.entries.map(e => ({
        tournament_id: tournament.id,
        entry_id: e.entryId,
        entry_name: e.entryName,
        rank: isPreRound ? 0 : e.rank,
        points: isPreRound ? 0 : e.points,
        time_remaining: isPreRound ? 0 : e.timeRemaining,
        lineup: e.lineup,
        payout: isPreRound ? 0 : e.payout,
      }));

      const { error: insertEntriesErr } = await sb.from('entries').upsert(entryRows, { onConflict: 'tournament_id,entry_id' });
      if (insertEntriesErr) throw new Error(`Insert entries failed: ${insertEntriesErr.message}`);

      // Step 4: Insert ownership data — deduplicate by golfer name first
      const ownershipMap = new Map<string, typeof previewData.ownership[0]>();
      for (const o of previewData.ownership) {
        ownershipMap.set(o.golferName, o); // last occurrence wins
      }
      const ownershipRows = Array.from(ownershipMap.values()).map(o => ({
        tournament_id: tournament.id,
        golfer_name: o.golferName,
        roster_position: o.rosterPosition,
        pct_drafted: o.pctDrafted,
        fpts: isPreRound ? 0 : o.fpts,
      }));

      const { error: insertOwnerErr } = await sb.from('golfer_ownership').upsert(ownershipRows, { onConflict: 'tournament_id,golfer_name' });
      if (insertOwnerErr) throw new Error(`Insert ownership failed: ${insertOwnerErr.message}`);

      setStatus('success');
      setMessage(isPreRound
        ? `Successfully uploaded ownership & lineups for ${tournament.name} (scores zeroed — upload round results after completion)`
        : `Successfully uploaded ${previewData.entries.length} entries and ${previewData.ownership.length} golfers for ${tournament.name} (Round ${currentRound})`
      );
    } catch (err) {
      setStatus('error');
      setMessage(`Upload error: ${err instanceof Error ? err.message : err}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50" style={{ background: 'var(--navy-800)', borderBottom: '2px solid var(--gold-500)' }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <h1 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-300)' }}>
            Admin &middot; Upload Results
          </h1>
          <a href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--gold-300)' }}>
            &larr; Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Supabase Status */}
        <div className="cb-card mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm">
              {isSupabaseConfigured() ? 'Supabase Connected' : 'Supabase Not Configured'}
            </span>
          </div>
          {!isSupabaseConfigured() && (
            <p className="text-xs text-gray-400 mt-2">
              Add your Supabase credentials to <code className="px-1 py-0.5 rounded bg-gray-100">.env.local</code> to enable uploads.
            </p>
          )}
        </div>

        {/* Upload Form */}
        <div className="cb-card mb-6">
          <h2 className="cb-card-header">Upload DraftKings CSV</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tournament</label>
              <select
                value={selectedTournament}
                onChange={e => setSelectedTournament(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm outline-none cursor-pointer"
                style={{ background: 'var(--gray-50)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)' }}
              >
                {TOURNAMENTS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}{t.isMajor ? ' (Major)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Upload Type</label>
              <select
                value={currentRound}
                onChange={e => setCurrentRound(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded text-sm outline-none cursor-pointer"
                style={{ background: 'var(--gray-50)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)' }}
              >
                <option value={0}>Pre-Round (Ownership Only)</option>
                <option value={1}>Round 1 (Thursday)</option>
                <option value={2}>Round 2 (Friday - Cut)</option>
                <option value={3}>Round 3 (Saturday)</option>
                <option value={4}>Round 4 (Sunday - Final)</option>
              </select>
              {currentRound === 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--gold-600)' }}>
                  Imports lineups & ownership only — scores will show as 0 until a round upload.
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:cursor-pointer"
              style={{ color: 'var(--gray-500)' }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">Or paste CSV data</label>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded text-xs font-mono outline-none resize-y"
              style={{ background: 'var(--gray-50)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)' }}
              placeholder="Paste DraftKings CSV export here..."
            />
            <button
              onClick={() => handlePreview()}
              disabled={!csvText}
              className="mt-2 px-4 py-2 rounded text-sm font-medium transition-all cursor-pointer disabled:opacity-30"
              style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)' }}
            >
              Preview Data
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="cb-card mb-6" style={{ borderColor: status === 'error' ? 'rgba(239,68,68,0.5)' : status === 'success' ? 'rgba(34,197,94,0.5)' : undefined }}>
            <p className={`text-sm ${status === 'error' ? 'text-red-500' : status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
              {message}
            </p>
          </div>
        )}

        {/* Preview */}
        {previewData && status === 'preview' && (
          <div className="cb-card">
            <h3 className="cb-card-header">Preview ({previewData.entries.length} entries)</h3>
            <div className="overflow-x-auto rounded-lg mb-4" style={{ maxHeight: '400px' }}>
              <table className="cb-table text-xs">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Points</th>
                    <th>Time Rem.</th>
                    <th>Payout</th>
                    <th>Lineup</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.entries.slice(0, 10).map(e => (
                    <tr key={e.entryId}>
                      <td>{e.rank}</td>
                      <td className="font-medium">{e.entryName}</td>
                      <td>{e.points}</td>
                      <td>{e.timeRemaining}</td>
                      <td style={{ color: e.payout > 0 ? '#16a34a' : 'var(--gray-400)' }}>
                        {e.payout > 0 ? `$${e.payout}` : '\u2014'}
                      </td>
                      <td className="text-gray-400 truncate max-w-xs">{e.lineup.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.entries.length > 10 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  ... and {previewData.entries.length - 10} more entries
                </p>
              )}
            </div>

            <button
              onClick={handleUpload}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.01] cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #BFA76A, #D4C089)', color: 'var(--navy-900)' }}
            >
              Upload to Supabase
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
