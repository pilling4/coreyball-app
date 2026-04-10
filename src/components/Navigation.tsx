'use client';

type Tab = 'tournaments' | 'standings' | 'earnings' | 'golfers';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'standings', label: 'Season Standings' },
    { id: 'earnings', label: 'Season Earnings' },
    { id: 'golfers', label: 'Golfer Stats' },
  ];

  return (
    <header className="sticky top-0 z-50" style={{ background: 'var(--navy-800)', borderBottom: '2px solid var(--gold-500)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CB" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold tracking-wide hidden sm:block"
              style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-300)' }}>
              COREYBALL
            </span>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-t transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-b-2'
                    : 'hover:bg-navy-700/50'
                }`}
                style={activeTab === tab.id ? {
                  color: 'var(--gold-300)',
                  borderBottomColor: 'var(--gold-300)',
                  background: 'rgba(191, 167, 106, 0.08)',
                } : {
                  color: '#94a3b8',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Admin link */}
          <a
            href="/admin"
            className="text-xs px-3 py-1.5 rounded border transition-all hover:bg-navy-700/50"
            style={{ color: '#64748b', borderColor: '#334155' }}
          >
            Admin
          </a>
        </div>
      </div>
    </header>
  );
}
