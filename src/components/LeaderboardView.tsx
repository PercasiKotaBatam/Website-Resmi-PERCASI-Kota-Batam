import { ArrowUpDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Athlete, AthleteCategory, RatingCategory } from '../types/chess';
import {
  CATEGORY_OPTIONS,
  filterAthletes,
  sortRatings,
  type RatingSortField,
  type SortDirection,
} from '../utils/portalLogic';
import { AthleteAvatar } from './AthleteAvatar';
import { TitleBadge } from './TitleBadge';

interface LeaderboardViewProps {
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
}

const RATING_TABS: { id: RatingCategory; label: string; desc: string }[] = [
  { id: 'standard', label: 'Standard', desc: 'Kontrol Waktu Klasik (90+30)' },
  { id: 'rapid', label: 'Rapid', desc: 'Catur Cepat (15+10)' },
  { id: 'blitz', label: 'Blitz', desc: 'Catur Kilat (5+3 / 3+2)' },
];

export function LeaderboardView({
  athletes,
  onSelectAthlete,
}: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<RatingCategory>('standard');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AthleteCategory | 'Semua'>('Semua');
  const [sortBy, setSortBy] = useState<RatingSortField>('rating');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const rankedAthletes = useMemo(() => {
    const filtered = filterAthletes(athletes, {
      query,
      category: categoryFilter,
    });
    return sortRatings(filtered, activeTab, sortBy, sortDir);
  }, [athletes, query, categoryFilter, activeTab, sortBy, sortDir]);

  const handleSort = (field: RatingSortField) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'rating' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#B91C1C] uppercase">
            Daftar Peringkat Resmi
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0F2342] sm:text-3xl">
            Peringkat Pecatur PERCASI Kota Batam
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Pemeringkatan resmi atlet Kota Batam untuk kategori Standard, Rapid,
            dan Blitz.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Pilih kategori rating"
          className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 sm:w-80"
        >
          {RATING_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`h-10 rounded text-xs font-bold whitespace-nowrap ${
                  active
                    ? 'bg-[#0F2342] text-white'
                    : 'text-slate-700 hover:text-[#0F2342]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label
            htmlFor="leaderboard-search"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Cari Atlet atau ID PERCASI
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="leaderboard-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama pemain, klub, atau ID PERCASI..."
              className="h-10 w-full rounded-md border border-slate-300 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F2342] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="leaderboard-category"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Filter Kategori
          </label>
          <select
            id="leaderboard-category"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as AthleteCategory | 'Semua')
            }
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-[#0F2342] focus:outline-none"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase">
                <th scope="col" className="px-4 py-3.5 w-16">
                  Pos
                </th>
                <th scope="col" className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort('percasiId')}
                    className="inline-flex items-center gap-1 hover:text-[#0F2342]"
                  >
                    <span>ID PERCASI</span>
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-[#0F2342]"
                  >
                    <span>Nama Atlet</span>
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Gelar
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Klub / Kecamatan
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Kategori
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('rating')}
                    className="inline-flex items-center justify-end gap-1 hover:text-[#0F2342]"
                  >
                    <span>Rating {activeTab.toUpperCase()}</span>
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedAthletes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Tidak ada atlet yang ditemukan untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                rankedAthletes.map((athlete, idx) => (
                  <tr
                    key={athlete.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="font-mono-tabular px-4 py-3 font-bold text-slate-500">
                      #{idx + 1}
                    </td>
                    <td className="font-mono-tabular px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {athlete.percasiId}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSelectAthlete(athlete)}
                        className="flex items-center gap-3 text-left font-bold text-slate-900 hover:text-[#0F2342] hover:underline"
                      >
                        <AthleteAvatar
                          name={athlete.fullName}
                          photoUrl={athlete.photoUrl}
                          size="sm"
                        />
                        <span>{athlete.fullName}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <TitleBadge title={athlete.title} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p className="font-medium text-slate-800">{athlete.club}</p>
                      <p className="text-slate-500">{athlete.district}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {athlete.category}
                    </td>
                    <td className="font-mono-tabular px-4 py-3 text-right text-base font-extrabold text-[#0F2342]">
                      {athlete.ratings[activeTab]}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
