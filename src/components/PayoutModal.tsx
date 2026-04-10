'use client';

import { PAYOUTS, TOTAL_POT } from '@/lib/constants';

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PayoutModal({ isOpen, onClose }: PayoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative animate-scaleIn max-w-md w-full bg-white rounded-2xl p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
        style={{ border: '2px solid var(--gold-500)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--navy-800)' }}>
            Payout Structure
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer">&times;</button>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-400">Total Prize Pool</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--navy-800)' }}>
            ${TOTAL_POT.toLocaleString()}
          </p>
        </div>

        {/* Event Payouts */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--gold-600)' }}>
            Event Payouts (60%)
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 rounded" style={{ background: 'var(--gray-50)' }}>
              <div>
                <span className="badge badge-major mr-2">Major</span>
                <span className="text-sm">1st Place</span>
              </div>
              <span className="font-semibold" style={{ color: 'var(--navy-800)' }}>
                ${PAYOUTS.major.first.amount} ({PAYOUTS.major.first.pct}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded" style={{ background: 'var(--gray-50)' }}>
              <div>
                <span className="badge badge-major mr-2">Major</span>
                <span className="text-sm">2nd Place</span>
              </div>
              <span className="font-semibold" style={{ color: 'var(--gray-700)' }}>
                ${PAYOUTS.major.second.amount} ({PAYOUTS.major.second.pct}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded" style={{ background: 'var(--gray-50)' }}>
              <div>
                <span className="text-sm">Non-Major 1st Place</span>
              </div>
              <span className="font-semibold" style={{ color: 'var(--gray-700)' }}>
                ${PAYOUTS.nonMajor.first.amount} ({PAYOUTS.nonMajor.first.pct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Season Payouts */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--gold-600)' }}>
            Season-Long Standings (40%)
          </h3>
          <div className="space-y-2">
            {[
              { emoji: '\u{1F947}', label: '1st Place', data: PAYOUTS.season.first },
              { emoji: '\u{1F948}', label: '2nd Place', data: PAYOUTS.season.second },
              { emoji: '\u{1F949}', label: '3rd Place', data: PAYOUTS.season.third },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded" style={{ background: 'var(--gray-50)' }}>
                <span className="text-sm">{item.emoji} {item.label}</span>
                <span className="font-semibold" style={{ color: 'var(--navy-800)' }}>
                  ${item.data.amount} ({item.data.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
