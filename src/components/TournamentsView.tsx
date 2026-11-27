import { ArrowRight, Calendar, FileSpreadsheet, MapPin, Pencil, Search, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Athlete, Tournament, TournamentStatus } from '../types/chess';
import {
  filterTournaments,
  getPlayerDisplayParts,
} from '../utils/portalLogic';
import { TitleBadge, TournamentStatusText } from './TitleBadge';

interface TournamentsViewProps {
  tournaments: Tournament[];
  athletes?: Athlete[];
  isAdminMode: boolean;
  onSelectTournament: (tournament: Tournament) => void;
  onSelectAthlete: (athleteName: string) => void;
  onUploadTournament: () => void;
  onEditTournament?: (tournament: Tournament) => void;
}

const STATUS_FILTERS: (TournamentStatus | 'Semua')[] = [
  'Semua',
  'Sedang Berlangsung',
  'Akan Datang',
  'Selesai',
];

export function TournamentsView({
  tournaments,
  athletes = [],
  isAdminMode,
  onSelectTournament,
  onSelectAthlete,
  onUploadTournament,
  onEditTournament,
}: TournamentsViewProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'Semua'>('Semua');

  const filtered = useMemo(
    () => filterTournaments(tournaments, query, statusFilter),
    [tournaments, query, statusFilter]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#B91C1C] uppercase">
            Kalender &amp; Klasemen Resmi
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0F2342] sm:text-3xl">
            Turnamen &amp; Hasil Pertandingan
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Jadwal resmi, klasemen akhir, nilai Buchholz, serta laporan hasil
            babak per babak kejuaraan catur di Kota Batam.
          </p>
        </div>

        {isAdminMode && (
          <button
            type="button"
            onClick={onUploadTournament}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white transition-colors hover:bg-[#173360] whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Upload Hasil Turnamen</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="tournament-search" className="sr-only">
            Cari nama turnamen, lokasi, atau wasit
          </label>
          <Search
            className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="tournament-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama turnamen, venue (DC Mall, Mega Mall), atau wasit..."
            className="h-10 w-full rounded-md border border-slate-300 bg-white pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F2342] focus:outline-none"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter status turnamen"
          className="flex flex-wrap gap-1 rounded-md bg-slate-100 p-1"
        >
          {STATUS_FILTERS.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(status)}
                className={`h-9 rounded px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#0F2342] text-white'
                    : 'text-slate-700 hover:text-[#0F2342]'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tournament List */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-base font-bold text-slate-900">
            Tidak ada turnamen yang sesuai
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Coba ubah kata kunci pencarian atau pilih status turnamen lainnya.
          </p>
        </div>
      ) : (
        <div data-testid="tournaments-list" className="mt-6 space-y-5">
          {filtered.map((trn) => {
            const topThree = trn.standings.slice(0, 3);
            return (
              <article
                key={trn.id}
                className="rounded-lg border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
              >
                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <TournamentStatusText status={trn.status} />
                      <span className="font-mono-tabular text-xs font-semibold text-slate-500">
                        {trn.timeControlCategory} · {trn.timeControlDetail}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-[#0F2342]">
                      <button
                        type="button"
                        onClick={() => onSelectTournament(trn)}
                        className="text-left hover:underline"
                      >
                        {trn.name}
                      </button>
                    </h2>

                    {trn.description && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {trn.description}
                      </p>
                    )}

                    <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>
                          {trn.startDate === trn.endDate
                            ? trn.startDate
                            : `${trn.startDate} – ${trn.endDate}`}{' '}
                          ({trn.rounds} Babak)
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>{trn.venue}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>Wasit Utama: {trn.chiefArbiter}</span>
                      </p>
                      <p className="font-mono-tabular flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {trn.participantsCount} Peserta
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{trn.organizer}</span>
                      </p>
                    </div>
                  </div>

                  {/* Top 3 Preview */}
                  <div className="flex flex-col justify-between rounded-md border border-slate-200 bg-slate-50 p-4 lg:col-span-5">
                    <div>
                      <p className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                        {topThree.length === 0 && (trn.initialRankings?.length ?? 0) > 0
                          ? 'Unggulan Terdaftar'
                          : trn.status === 'Akan Datang'
                            ? 'Unggulan Terdaftar'
                            : 'Klasemen 3 Besar'}
                      </p>

                      {topThree.length > 0 ? (
                        <div className="mt-3 divide-y divide-slate-200">
                          {topThree.map((entry) => {
                            const { displayName, masterTitle } =
                              getPlayerDisplayParts(
                                entry.name,
                                athletes,
                                entry.title
                              );
                            const badgeTitle = masterTitle ?? entry.title;
                            return (
                              <div
                                key={`${trn.id}-${entry.rank}-${entry.name}`}
                                className="flex items-center justify-between gap-2 py-2 text-xs"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="font-mono-tabular w-5 font-bold text-slate-500">
                                    #{entry.rank}
                                  </span>
                                  <TitleBadge title={badgeTitle} />
                                  <button
                                    type="button"
                                    onClick={() => onSelectAthlete(entry.name)}
                                    className="truncate text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                  >
                                    {displayName}
                                  </button>
                                </div>
                                <span className="font-mono-tabular font-bold text-[#0F2342] shrink-0">
                                  {entry.points.toFixed(1)} pts
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (trn.initialRankings?.length ?? 0) > 0 ? (
                        <div className="mt-3 divide-y divide-slate-200">
                          {(trn.initialRankings ?? []).slice(0, 3).map((entry) => {
                            const rtg = entry.rating ?? entry.nationalRating;
                            const { displayName, masterTitle } =
                              getPlayerDisplayParts(
                                entry.name,
                                athletes,
                                entry.title
                              );
                            return (
                              <div
                                key={`${trn.id}-seed-${entry.sNo}-${entry.name}`}
                                className="flex items-center justify-between gap-2 py-2 text-xs"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="font-mono-tabular w-5 font-bold text-slate-500">
                                    #{entry.sNo}
                                  </span>
                                  {masterTitle && <TitleBadge title={masterTitle} />}
                                  <button
                                    type="button"
                                    onClick={() => onSelectAthlete(entry.name)}
                                    className="truncate text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                  >
                                    {displayName}
                                  </button>
                                </div>
                                <span className="font-mono-tabular font-bold text-[#0F2342] shrink-0">
                                  {rtg && rtg !== '-' ? `Rtg ${rtg}` : entry.fed ?? 'INA'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">
                          Daftar klasemen akan tersedia setelah hasil diunggah.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-3">
                      {isAdminMode && onEditTournament && (
                        <button
                          type="button"
                          onClick={() => onEditTournament(trn)}
                          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#0F2342] bg-white px-3.5 text-xs font-bold text-[#0F2342] transition-colors hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit Turnamen</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectTournament(trn)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white transition-colors hover:bg-[#173360]"
                      >
                        <span>Buka Klasemen &amp; Pairing</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
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
