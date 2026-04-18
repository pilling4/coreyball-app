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
  shortLabel: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const TABS: TabDef[] = [
  { id: 'tournaments', label: 'Tournaments', shortLabel: 'Events', Icon: Trophy },
  { id: 'standings', label: 'Season Standings', shortLabel: 'Standings', Icon: BarChart3 },
  { id: 'earnings', label: 'Season Earnings', shortLabel: 'Earnings', Icon: DollarSign },
  { id: 'golfers', label: 'Golfer Stats', shortLabel: 'Golfers', Icon: Users },
];

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <>
      {/* Top Header — always visible */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'var(--navy-800)', borderBottom: '2px solid var(--gold-500)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="CB" className="w-9 h-9 object-contain" />
              <span
                className="text-lg font-bold tracking-wide"
                style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-300)' }}
              >
                COREYBALL
              </span>
            </div>

            {/* Desktop Tabs — hidden on mobile */}
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

            {/* Admin link */}
            <a
              href="/admin"
              className="text-xs px-3 py-1.5 rounded border transition-all"
              style={{ color: '#64748b', borderColor: '#334155' }}
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar — hidden on desktop */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--navy-800)',
          borderTop: '2px solid var(--gold-500)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="grid grid-cols-4">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const { Icon } = tab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center gap-1 py-2.5 transition-all cursor-pointer"
                style={{
                  color: isActive ? 'var(--gold-300)' : '#94a3b8',
                  minHeight: '56px',
                }}
                aria-label={tab.label}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ letterSpacing: '0.02em' }}
                >
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
