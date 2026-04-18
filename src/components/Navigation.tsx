'use client';

import { Trophy, BarChart3, DollarSign, Users } from 'lucide-react';

type Tab = 'tournaments' | 'standings' | 'earnings' | 'golfers';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

interface TabDef {
  id: Tab;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const TABS: TabDef[] = [
  { id: 'tournaments', label: 'Tournaments', Icon: Trophy },
  { id: 'standings', label: 'Season Standings', Icon: BarChart3 },
  { id: 'earnings', label: 'Season Earnings', Icon: DollarSign },
  { id: 'golfers', label: 'Golfer Stats', Icon: Users },
];

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <>
      {/* Top Header */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'var(--navy-800)', borderBottom: '2px solid var(--gold-500)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative flex items-center h-14">
            {/* Centered logo — absolutely positioned so it stays dead-center regardless of siblings */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png?v=5" alt="Coreyball" className="w-10 h-10 object-contain" />
            </div>

            {/* Desktop Tabs — left side, hidden on mobile */}
            <nav className="hidden md:flex gap-1">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-t transition-all cursor-pointer ${
                      isActive ? 'border-b-2' : ''
                    }`}
                    style={
                      isActive
                        ? {
                            color: 'var(--gold-300)',
                            borderBottomColor: 'var(--gold-300)',
                            background: 'rgba(191, 167, 106, 0.08)',
                          }
                        : { color: '#94a3b8' }
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Admin link — always pushed to the right */}
            <a
              href="/admin"
              className="ml-auto text-xs px-3 py-1.5 rounded border transition-all relative z-10"
              style={{ color: '#64748b', borderColor: '#334155' }}
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--navy-800)',
          borderTop: '2px solid var(--gold-500)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="grid grid-cols-4" style={{ height: '68px' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const { Icon } = tab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex items-start justify-center transition-all cursor-pointer"
                style={{
                  color: isActive ? 'var(--gold-300)' : '#94a3b8',
                  paddingTop: '14px',
                }}
                aria-label={tab.label}
              >
                <Icon className="w-7 h-7" strokeWidth={isActive ? 2.5 : 2} />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
