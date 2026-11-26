import { Menu, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import type { NavSection } from '../types/chess';
import { PercasiLogo } from './PercasiLogo';

interface HeaderProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  isAdminMode: boolean;
  onToggleAdmin: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'berita', label: 'Berita' },
  { id: 'keanggotaan', label: 'Keanggotaan' },
  { id: 'turnamen', label: 'Turnamen' },
  { id: 'peringkat', label: 'Peringkat' },
  { id: 'tentang', label: 'Tentang Kami' },
];

export function Header({
  activeSection,
  onNavigate,
  isAdminMode,
  onToggleAdmin,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectNav = (id: NavSection) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:gap-6 sm:px-6 lg:gap-8 lg:px-8">
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            handleSelectNav('beranda');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F2342]"
        >
          <PercasiLogo className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" />
          <span className="text-sm font-extrabold tracking-tight text-[#0F2342] sm:text-lg whitespace-nowrap shrink-0">
            PERCASI Kota Batam
          </span>
        </a>

        <nav
          aria-label="Navigasi Utama"
          className="hidden lg:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectNav(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F2342] ${
                  isActive
                    ? 'text-[#0F2342] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#B91C1C]'
                    : 'text-slate-600 hover:text-[#0F2342]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleAdmin}
            aria-pressed={isAdminMode}
            className={`inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2342] ${
              isAdminMode
                ? 'bg-[#B91C1C] text-white hover:bg-[#991B1B]'
                : 'bg-[#0F2342] text-white hover:bg-[#173360]'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sm:hidden">{isAdminMode ? 'Admin' : 'Admin'}</span>
            <span className="hidden sm:inline">
              {isAdminMode ? 'Mode Admin: Aktif' : 'Mode Admin'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2342]"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav
            aria-label="Navigasi Seluler"
            className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectNav(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex h-11 items-center border-b border-slate-100 px-2 text-sm font-semibold last:border-b-0 ${
                    isActive ? 'text-[#B91C1C]' : 'text-slate-700 hover:text-[#0F2342]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
