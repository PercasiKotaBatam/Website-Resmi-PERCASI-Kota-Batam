import { Edit3, RotateCcw, Search, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  Athlete,
  AthleteCategory,
  BatamDistrict,
  TitleCode,
} from '../types/chess';
import {
  CATEGORY_OPTIONS,
  DISTRICT_OPTIONS,
  TITLE_OPTIONS,
  calculateAthleteAge,
  filterAthletes,
  formatAthleteBirthDisplay,
} from '../utils/portalLogic';
import { AthleteAvatar } from './AthleteAvatar';
import { TitleBadge } from './TitleBadge';

interface MembersViewProps {
  athletes: Athlete[];
  isAdminMode: boolean;
  onSelectAthlete: (athlete: Athlete) => void;
  onAddMember: () => void;
  onEditMember: (athlete: Athlete) => void;
}

export function MembersView({
  athletes,
  isAdminMode,
  onSelectAthlete,
  onAddMember,
  onEditMember,
}: MembersViewProps) {
  const [query, setQuery] = useState('');
  const [titleFilter, setTitleFilter] = useState<TitleCode | 'Semua'>('Semua');
  const [categoryFilter, setCategoryFilter] = useState<AthleteCategory | 'Semua'>('Semua');
  const [districtFilter, setDistrictFilter] = useState<BatamDistrict | 'Semua'>('Semua');

  const filteredAthletes = useMemo(
    () =>
      filterAthletes(athletes, {
        query,
        title: titleFilter,
        category: categoryFilter,
        district: districtFilter,
      }),
    [athletes, query, titleFilter, categoryFilter, districtFilter]
  );

  const hasActiveFilters =
    Boolean(query.trim()) ||
    titleFilter !== 'Semua' ||
    categoryFilter !== 'Semua' ||
    districtFilter !== 'Semua';

  const resetFilters = () => {
    setQuery('');
    setTitleFilter('Semua');
    setCategoryFilter('Semua');
    setDistrictFilter('Semua');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#B91C1C] uppercase">
            Basis Data Resmi Atlet
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0F2342] sm:text-3xl">
            Keanggotaan &amp; Profil Atlet Batam
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Menampilkan{' '}
            <span className="font-mono-tabular font-bold text-[#0F2342]">
              {filteredAthletes.length}
            </span>{' '}
            dari{' '}
            <span className="font-mono-tabular font-bold text-[#0F2342]">
              {athletes.length}
            </span>{' '}
            atlet terdaftar di Pengkot PERCASI Kota Batam.
          </p>
        </div>

        {isAdminMode && (
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white transition-colors hover:bg-[#173360] whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Anggota Baru</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label
            htmlFor="member-search"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Cari Nama / Klub / Kecamatan
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="member-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: Godfrid, Semanggi, Batam Kota..."
              className="h-10 w-full rounded-md border border-slate-300 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F2342] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="filter-title"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Gelar
          </label>
          <select
            id="filter-title"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value as TitleCode | 'Semua')}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-[#0F2342] focus:outline-none"
          >
            <option value="Semua">Semua Gelar</option>
            {TITLE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-category"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Kategori
          </label>
          <select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as AthleteCategory | 'Semua')
            }
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-[#0F2342] focus:outline-none"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-district"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Klub / Kecamatan
          </label>
          <select
            id="filter-district"
            value={districtFilter}
            onChange={(e) =>
              setDistrictFilter(e.target.value as BatamDistrict | 'Semua')
            }
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-[#0F2342] focus:outline-none"
          >
            <option value="Semua">Semua Kecamatan</option>
            {DISTRICT_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Atur Ulang Filter</span>
          </button>
        </div>
      )}

      {/* Athletes Vertical List */}
      {filteredAthletes.length === 0 ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-base font-bold text-slate-900">
            Tidak ada atlet yang sesuai dengan filter pencarian
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Ubah kata kunci pencarian atau atur ulang pilihan filter gelar,
            kategori, dan kecamatan.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex h-10 items-center rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white hover:bg-[#173360]"
          >
            Tampilkan Semua Atlet
          </button>
        </div>
      ) : (
        <div
          data-testid="members-list"
          className="mt-6 space-y-3"
        >
          {filteredAthletes.map((athlete, idx) => {
            const birthDisplay = formatAthleteBirthDisplay(
              athlete.birthDate,
              athlete.birthYear
            );
            const age = calculateAthleteAge(
              athlete.birthDate,
              athlete.birthYear
            );
            return (
              <article
                key={athlete.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 lg:flex-row lg:items-center lg:justify-between lg:px-5"
              >
                {/* Identity & Club */}
                <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center">
                  <span className="font-mono-tabular hidden w-7 shrink-0 text-right text-xs font-bold text-slate-400 sm:inline-block">
                    #{idx + 1}
                  </span>
                  <AthleteAvatar
                    name={athlete.fullName}
                    photoUrl={athlete.photoUrl}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <TitleBadge title={athlete.title} />
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {athlete.federationStatus}
                      </span>
                      <span className="text-xs text-slate-500">
                        {athlete.category}
                      </span>
                    </div>
                    <h2 className="mt-1 truncate text-base font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => onSelectAthlete(athlete)}
                        className="text-left hover:text-[#0F2342] hover:underline"
                      >
                        {athlete.fullName}
                      </button>
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-slate-600">
                      {athlete.club} ·{' '}
                      <span className="font-medium text-slate-800">
                        Kec. {athlete.district}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Birth Date, Age, Ratings & Actions */}
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap sm:items-center lg:border-t-0 lg:pt-0 lg:gap-5">
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-5">
                    <div className="min-w-[118px]">
                      <p className="text-[11px] font-medium text-slate-500">
                        Tanggal Lahir
                      </p>
                      <p className="font-mono-tabular mt-0.5 text-xs font-semibold text-slate-900">
                        {birthDisplay}
                      </p>
                    </div>
                    <div className="min-w-[74px]">
                      <p className="text-[11px] font-medium text-slate-500">
                        Umur
                      </p>
                      <p className="font-mono-tabular mt-0.5 text-xs font-semibold text-slate-900">
                        {age !== null ? `${age} tahun` : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Compact Ratings */}
                  <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 bg-slate-50 py-1.5 text-center sm:w-48">
                    <div className="px-2">
                      <p className="text-[10px] font-medium text-slate-500">
                        STD
                      </p>
                      <p className="font-mono-tabular text-xs font-bold text-[#0F2342]">
                        {athlete.ratings.standard > 0 ? athlete.ratings.standard : '-'}
                      </p>
                    </div>
                    <div className="px-2">
                      <p className="text-[10px] font-medium text-slate-500">
                        RPD
                      </p>
                      <p className="font-mono-tabular text-xs font-bold text-[#0F2342]">
                        {athlete.ratings.rapid > 0 ? athlete.ratings.rapid : '-'}
                      </p>
                    </div>
                    <div className="px-2">
                      <p className="text-[10px] font-medium text-slate-500">
                        BLZ
                      </p>
                      <p className="font-mono-tabular text-xs font-bold text-[#0F2342]">
                        {athlete.ratings.blitz > 0 ? athlete.ratings.blitz : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center gap-2 sm:ml-auto lg:ml-0">
                    <button
                      type="button"
                      onClick={() => onSelectAthlete(athlete)}
                      className="inline-flex h-9 items-center rounded-md border border-[#0F2342]/20 bg-slate-50 px-3 text-xs font-bold text-[#0F2342] hover:bg-[#0F2342] hover:text-white whitespace-nowrap"
                    >
                      Lihat Profil
                    </button>

                    {isAdminMode && (
                      <button
                        type="button"
                        onClick={() => onEditMember(athlete)}
                        aria-label={`Edit profil ${athlete.fullName}`}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                      >
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
