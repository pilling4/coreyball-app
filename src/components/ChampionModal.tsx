'use client';

interface ChampionModalProps {
  isOpen: boolean;
  onClose: () => void;
  champion: string;
  totalWinnings: number;
}

export default function ChampionModal({ isOpen, onClose, champion, totalWinnings }: ChampionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative animate-scaleIn max-w-md w-full rounded-2xl p-8 shadow-2xl text-center"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, var(--navy-900), var(--navy-800), var(--navy-900))',
          border: '2px solid var(--gold-500)',
          boxShadow: '0 20px 60px rgba(191, 167, 106, 0.35), 0 0 0 1px rgba(191, 167, 106, 0.3)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xl cursor-pointer transition-colors"
          style={{ color: 'var(--gold-400)' }}
          aria-label="Close"
        >
          &times;
        </button>

        <div className="text-7xl mb-2 animate-bounce" style={{ animationDuration: '2s' }}>
          {'\u{1F3C6}'}
        </div>

        <p
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: 'var(--gold-400)', letterSpacing: '0.3em' }}
        >
          Congratulations to the
        </p>

        <h2
          className="text-2xl font-bold mb-4"
          style={{
            fontFamily: 'Georgia, serif',
            color: 'var(--gold-300)',
            letterSpacing: '0.05em',
          }}
        >
          2026 COREYBALL CHAMPION
        </h2>

        <div
          className="my-5 py-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(191,167,106,0.15), rgba(191,167,106,0.05))',
            border: '1px solid rgba(191, 167, 106, 0.4)',
          }}
        >
          <p
            className="text-3xl font-bold"
            style={{
              fontFamily: 'Georgia, serif',
              color: 'white',
              letterSpacing: '0.02em',
            }}
          >
            {champion}
          </p>
        </div>

        <p
          className="text-xs font-semibold uppercase tracking-wider mt-4 mb-1"
          style={{ color: 'var(--gold-400)', letterSpacing: '0.2em' }}
        >
          Total Prize Winnings
        </p>
        <p
          className="text-4xl font-bold"
          style={{
            fontFamily: 'Georgia, serif',
            color: '#4ade80',
          }}
        >
          ${totalWinnings.toLocaleString()}
        </p>

        <button
          onClick={onClose}
          className="mt-6 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #BFA76A, #D4C089, #A8935A)',
            color: 'var(--navy-900)',
            boxShadow: '0 4px 16px rgba(191, 167, 106, 0.3)',
          }}
        >
          Take a Bow
        </button>
      </div>
    </div>
  );
}
