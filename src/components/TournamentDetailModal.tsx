import {
  ArrowUpDown,
  Calendar,
  Check,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { InitialRankEntry, Tournament } from '../types/chess';
import {
  buildInitialRankings,
  filterPairingsByRound,
  formatRatingDelta,
  sortInitialRankings,
} from '../utils/portalLogic';
import { TitleBadge, TournamentStatusText } from './TitleBadge';

interface TournamentDetailModalProps {
  tournament: Tournament | null;
  isAdminMode?: boolean;
  onClose: () => void;
  onSelectAthlete: (athleteName: string, tournamentId: string) => void;
  onEditTournament?: (tournament: Tournament) => void;
  onUpdateTournament?: (tournament: Tournament) => void;
}

interface EditableInitialRankRow {
  rowKey: string;
  sNo: string;
  name: string;
  gender: string;
  rating: string;
  nationalRating: string;
  internationalRating: string;
  fed: string;
  clubCity: string;
  title?: string;
  category?: string;
}

function toEditableInitialRankRow(
  entry: InitialRankEntry,
  idx: number
): EditableInitialRankRow {
  return {
    rowKey: `ir-${idx}-${entry.sNo}-${entry.name}`,
    sNo: String(entry.sNo ?? idx + 1),
    name: entry.name ?? '',
    gender: entry.gender ?? 'Putra',
    rating:
      entry.rating !== undefined && entry.rating !== '-'
        ? String(entry.rating)
        : '',
    nationalRating:
      entry.nationalRating !== undefined && entry.nationalRating !== '-'
        ? String(entry.nationalRating)
        : '',
    internationalRating:
      entry.internationalRating !== undefined && entry.internationalRating !== '-'
        ? String(entry.internationalRating)
        : '',
    fed: entry.fed ?? 'INA',
    clubCity: entry.clubCity ?? entry.club ?? '',
    title: entry.title,
    category: entry.category,
  };
}

function parseRatingField(raw: string): number | '-' {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-') return '-';
  const num = Number.parseInt(trimmed, 10);
  return Number.isFinite(num) && num > 0 ? num : '-';
}

function fromEditableInitialRankRow(
  row: EditableInitialRankRow,
  idx: number,
  useDualRating: boolean
): InitialRankEntry {
  const parsedSNo = Number.parseInt(row.sNo.trim(), 10);
  const sNo = Number.isFinite(parsedSNo) && parsedSNo > 0 ? parsedSNo : idx + 1;
  const cleanName = row.name.trim();
  const cleanClub = row.clubCity.trim() || '-';
  const cleanFed = row.fed.trim().toUpperCase() || 'INA';
  const cleanGender = row.gender.trim() || 'Putra';

  if (useDualRating) {
    return {
      sNo,
      name: cleanName,
      gender: cleanGender,
      nationalRating: parseRatingField(row.nationalRating || row.rating),
      internationalRating: parseRatingField(row.internationalRating),
      fed: cleanFed,
      clubCity: cleanClub,
      ...(row.title ? { title: row.title } : {}),
      ...(row.category ? { category: row.category } : {}),
    };
  }

  return {
    sNo,
    name: cleanName,
    gender: cleanGender,
    rating: parseRatingField(row.rating || row.nationalRating),
    fed: cleanFed,
    clubCity: cleanClub,
    ...(row.title ? { title: row.title } : {}),
    ...(row.category ? { category: row.category } : {}),
  };
}

export function TournamentDetailModal({
  tournament,
  isAdminMode = false,
  onClose,
  onSelectAthlete,
  onEditTournament,
  onUpdateTournament,
}: TournamentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'standings' | 'initialRank' | 'pairings'>('standings');
  const [selectedRound, setSelectedRound] = useState<number | 'all'>(1);
  const [editingInitialRank, setEditingInitialRank] = useState(false);
  const [draftInitialRows, setDraftInitialRows] = useState<EditableInitialRankRow[]>([]);
  const [initialEditQuery, setInitialEditQuery] = useState('');
  const [initialEditError, setInitialEditError] = useState('');

  useEffect(() => {
    if (
      tournament &&
      tournament.standings.length === 0 &&
      (tournament.initialRankings?.length ?? 0) > 0
    ) {
      setActiveTab('initialRank');
    } else {
      setActiveTab('standings');
    }
    if (tournament && tournament.pairings.length > 0) {
      const firstRound = Math.min(...tournament.pairings.map((p) => p.round));
      setSelectedRound(firstRound);
    } else {
      setSelectedRound('all');
    }
    setEditingInitialRank(false);
    setInitialEditQuery('');
    setInitialEditError('');
  }, [tournament?.id]);

  useEffect(() => {
    if (!isAdminMode) {
      setEditingInitialRank(false);
      setInitialEditError('');
    }
  }, [isAdminMode]);

  useEffect(() => {
    if (!tournament) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tournament, onClose]);

  if (!tournament) return null;

  const roundNumbers = Array.from(
    new Set(tournament.pairings.map((p) => p.round))
  ).sort((a, b) => a - b);

  const effectiveRound: number | 'all' =
    selectedRound === 'all' || roundNumbers.includes(selectedRound)
      ? selectedRound
      : (roundNumbers[0] ?? 'all');

  const visibleRoundNumbers = filterPairingsByRound(
    tournament.pairings,
    effectiveRound
  );
  const initialRankings = buildInitialRankings(
    tournament.standings,
    tournament.initialRankings
  );
  const hasDualRatingInitialCols = initialRankings.some(
    (row) =>
      row.nationalRating !== undefined ||
      row.internationalRating !== undefined
  );
  const hasSingleRatingExtendedCols =
    !hasDualRatingInitialCols &&
    initialRankings.some(
      (row) => row.gender !== undefined || row.clubCity !== undefined
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tournament-detail-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <TournamentStatusText status={tournament.status} />
            <span className="font-mono-tabular text-xs font-semibold text-slate-500">
              {tournament.timeControlCategory} · {tournament.rounds} Babak
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdminMode && onEditTournament && (
              <button
                type="button"
                onClick={() => onEditTournament(tournament)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#0F2342] bg-white px-3 text-xs font-bold text-[#0F2342] hover:bg-slate-100"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit Turnamen</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={`Tutup hasil turnamen ${tournament.name}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h2
              id="tournament-detail-title"
              className="text-2xl font-extrabold text-[#0F2342]"
            >
              {tournament.name}
            </h2>
            {tournament.description && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {tournament.description}
              </p>
            )}

            <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 sm:grid-cols-3">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                <span>
                  {tournament.startDate === tournament.endDate
                    ? tournament.startDate
                    : `${tournament.startDate} – ${tournament.endDate}`}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                <span>{tournament.venue}</span>
              </p>
              <p className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                <span>Wasit Utama: {tournament.chiefArbiter}</span>
              </p>
            </div>
          </div>

          {/* Subtabs: Klasemen Akhir, Peringkat Awal, Pairing & Hasil Babak */}
          <div
            role="tablist"
            aria-label="Tampilan detail turnamen"
            className="inline-flex flex-wrap gap-1 rounded-md bg-slate-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'standings'}
              onClick={() => setActiveTab('standings')}
              className={`h-9 rounded px-4 text-xs font-bold transition-colors ${
                activeTab === 'standings'
                  ? 'bg-[#0F2342] text-white'
                  : 'text-slate-700 hover:text-[#0F2342]'
              }`}
            >
              Klasemen Akhir ({tournament.standings.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'initialRank'}
              onClick={() => setActiveTab('initialRank')}
              className={`h-9 rounded px-4 text-xs font-bold transition-colors ${
                activeTab === 'initialRank'
                  ? 'bg-[#0F2342] text-white'
                  : 'text-slate-700 hover:text-[#0F2342]'
              }`}
            >
              Peringkat Awal ({initialRankings.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pairings'}
              onClick={() => setActiveTab('pairings')}
              className={`h-9 rounded px-4 text-xs font-bold transition-colors ${
                activeTab === 'pairings'
                  ? 'bg-[#0F2342] text-white'
                  : 'text-slate-700 hover:text-[#0F2342]'
              }`}
            >
              Pairing &amp; Hasil Babak ({tournament.pairings.length})
            </button>
          </div>

          {activeTab === 'standings' ? (
            tournament.standings.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Data klasemen belum dipublikasikan untuk turnamen ini.
              </div>
            ) : tournament.standings.some((row) => row.sNo !== undefined) ? (
              <div className="overflow-hidden rounded-md border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                        <th scope="col" className="w-12 px-2.5 py-2.5 text-center whitespace-nowrap">
                          Rank
                        </th>
                        <th scope="col" className="w-14 px-2.5 py-2.5 text-center whitespace-nowrap">
                          S. No.
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                          Name
                        </th>
                        <th scope="col" className="w-16 px-2.5 py-2.5 text-center whitespace-nowrap">
                          Rating
                        </th>
                        <th scope="col" className="w-14 px-2.5 py-2.5 text-center whitespace-nowrap">
                          FED
                        </th>
                        <th scope="col" className="w-20 px-2.5 py-2.5 text-center whitespace-nowrap">
                          Category
                        </th>
                        <th scope="col" className="w-14 px-2.5 py-2.5 text-center whitespace-nowrap">
                          Pts.
                        </th>
                        <th scope="col" className="w-12 px-2.5 py-2.5 text-center whitespace-nowrap">
                          DE
                        </th>
                        <th scope="col" className="w-14 px-2.5 py-2.5 text-center whitespace-nowrap">
                          BH
                        </th>
                        <th scope="col" className="w-16 px-2.5 py-2.5 text-center whitespace-nowrap">
                          SB
                        </th>
                        <th scope="col" className="w-14 px-2.5 py-2.5 text-center whitespace-nowrap">
                          PS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tournament.standings.map((row) => (
                        <tr
                          key={`${row.rank}-${row.name}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="font-mono-tabular px-2.5 py-2 text-center font-bold text-[#0F2342]">
                            {row.rank}
                          </td>
                          <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-600">
                            {row.sNo ?? '-'}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            <button
                              type="button"
                              onClick={() => onSelectAthlete(row.name, tournament.id)}
                              className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                            >
                              {row.name}
                            </button>
                          </td>
                          <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-700">
                            {row.rating ?? '-'}
                          </td>
                          <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-600">
                            {row.fed ?? '-'}
                          </td>
                          <td className="px-2.5 py-2 text-center text-slate-700 whitespace-nowrap">
                            {row.category ?? '-'}
                          </td>
                          <td className="font-mono-tabular px-2.5 py-2 text-center font-extrabold text-[#0F2342]">
                            {row.pointsDisplay ?? row.points.toFixed(1)}
                          </td>
                          <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-600">
                            {row.de ?? 0}
                          </td>
                          <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-700">
                            {row.bhDisplay ?? row.buchholz.toFixed(1)}
                          </td>
                          <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-700">
                            {row.sb ?? '-'}
                          </td>
                          <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-700">
                            {row.ps ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase">
                        <th scope="col" className="px-3 py-3 w-16">
                          Peringkat
                        </th>
                        <th scope="col" className="px-3 py-3">
                          Gelar
                        </th>
                        <th scope="col" className="px-3 py-3">
                          Nama Pemain
                        </th>
                        <th scope="col" className="px-3 py-3">
                          Klub / Kecamatan
                        </th>
                        <th scope="col" className="px-3 py-3 text-right">
                          Poin
                        </th>
                        <th scope="col" className="px-3 py-3 text-right">
                          Buchholz
                        </th>
                        <th scope="col" className="px-3 py-3 text-right">
                          +/- Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tournament.standings.map((row) => (
                        <tr
                          key={`${row.rank}-${row.name}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="font-mono-tabular px-3 py-2.5 font-bold text-[#0F2342]">
                            #{row.rank}
                          </td>
                          <td className="px-3 py-2.5">
                            <TitleBadge title={row.title} />
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-900">
                            <button
                              type="button"
                              onClick={() => onSelectAthlete(row.name, tournament.id)}
                              className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                            >
                              {row.name}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">
                            {row.club}
                          </td>
                          <td className="font-mono-tabular px-3 py-2.5 text-right font-extrabold text-[#0F2342]">
                            {row.points.toFixed(1)}
                          </td>
                          <td className="font-mono-tabular px-3 py-2.5 text-right text-slate-600">
                            {row.buchholz.toFixed(1)}
                          </td>
                          <td
                            className={`font-mono-tabular px-3 py-2.5 text-right font-bold ${
                              row.ratingChange > 0
                                ? 'text-emerald-700'
                                : row.ratingChange < 0
                                  ? 'text-[#B91C1C]'
                                  : 'text-slate-500'
                            }`}
                          >
                            {formatRatingDelta(row.ratingChange)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : activeTab === 'initialRank' ? (
            (() => {
              const canEditInitialRank = isAdminMode && Boolean(onUpdateTournament);
              const normalizedEditQuery = initialEditQuery.trim().toLowerCase();
              const visibleDraftRows = normalizedEditQuery
                ? draftInitialRows.filter((row) =>
                    [row.name, row.clubCity, row.sNo, row.fed]
                      .join(' ')
                      .toLowerCase()
                      .includes(normalizedEditQuery)
                  )
                : draftInitialRows;

              const startEditingInitialRank = () => {
                setDraftInitialRows(
                  initialRankings.map((entry, idx) =>
                    toEditableInitialRankRow(entry, idx)
                  )
                );
                setInitialEditQuery('');
                setInitialEditError('');
                setEditingInitialRank(true);
              };

              const handleAddInitialRow = () => {
                const nextSNo = draftInitialRows.length + 1;
                const newKey = `ir-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                setInitialEditQuery('');
                setInitialEditError('');
                setDraftInitialRows((prev) => [
                  {
                    rowKey: newKey,
                    sNo: String(nextSNo),
                    name: '',
                    gender: 'Putra',
                    rating: '',
                    nationalRating: '',
                    internationalRating: '',
                    fed: 'INA',
                    clubCity: '',
                  },
                  ...prev,
                ]);
              };

              const handleSortDraftRows = () => {
                const converted = draftInitialRows.map((row, idx) =>
                  fromEditableInitialRankRow(row, idx, hasDualRatingInitialCols)
                );
                const sorted = sortInitialRankings(converted);
                setDraftInitialRows(
                  sorted.map((entry, idx) => toEditableInitialRankRow(entry, idx))
                );
                setInitialEditError('');
              };

              const handleUpdateDraftRow = (
                rowKey: string,
                field: keyof EditableInitialRankRow,
                value: string
              ) => {
                setDraftInitialRows((prev) =>
                  prev.map((row) =>
                    row.rowKey === rowKey ? { ...row, [field]: value } : row
                  )
                );
              };

              const handleRemoveDraftRow = (rowKey: string) => {
                setDraftInitialRows((prev) =>
                  prev.filter((row) => row.rowKey !== rowKey)
                );
              };

              const handleSaveInitialRank = () => {
                if (!onUpdateTournament) return;
                const emptyRowIdx = draftInitialRows.findIndex(
                  (row) => !row.name.trim()
                );
                if (emptyRowIdx >= 0) {
                  setInitialEditError(
                    'Nama pemain pada setiap baris peringkat awal wajib diisi.'
                  );
                  return;
                }
                const savedEntries = draftInitialRows.map((row, idx) =>
                  fromEditableInitialRankRow(row, idx, hasDualRatingInitialCols)
                );
                const updatedTournament: Tournament = {
                  ...tournament,
                  initialRankings: savedEntries,
                  participantsCount: Math.max(
                    savedEntries.length,
                    tournament.standings.length
                  ),
                };
                onUpdateTournament(updatedTournament);
                setEditingInitialRank(false);
                setInitialEditQuery('');
                setInitialEditError('');
              };

              if (editingInitialRank && canEditInitialRank) {
                return (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50/80 px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-amber-950">
                          Edit Daftar Peringkat Awal ({draftInitialRows.length} pemain)
                        </p>
                        <p className="text-[11px] text-amber-900">
                          Ubah nama, klub/kecamatan, atau rating pemain. Kosongkan atau isi &quot;-&quot; jika tanpa rating.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddInitialRow}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Tambah Pemain</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSortDraftRows}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#0F2342] bg-white px-3 text-xs font-semibold text-[#0F2342] hover:bg-slate-100"
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Urutkan Rating &amp; Abjad</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingInitialRank(false);
                            setInitialEditError('');
                          }}
                          className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveInitialRank}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white hover:bg-[#173360]"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Simpan Peringkat Awal</span>
                        </button>
                      </div>
                    </div>

                    {initialEditError && (
                      <div
                        role="alert"
                        className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-[#B91C1C]"
                      >
                        {initialEditError}
                      </div>
                    )}

                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        aria-label="Cari pemain pada editor peringkat awal"
                        value={initialEditQuery}
                        onChange={(e) => setInitialEditQuery(e.target.value)}
                        placeholder="Cari nama pemain, klub/kecamatan, atau S. No..."
                        className="h-9 w-full rounded-md border border-slate-300 bg-white pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0F2342] focus:outline-none"
                      />
                    </div>

                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <div className="max-h-[420px] overflow-auto">
                        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                          <thead className="sticky top-0 z-10 bg-slate-50">
                            <tr className="border-b border-slate-200 text-xs font-bold text-slate-600">
                              <th scope="col" className="w-16 px-2 py-2.5 text-center">
                                S. No.
                              </th>
                              <th scope="col" className="px-2 py-2.5">
                                Name *
                              </th>
                              <th scope="col" className="w-24 px-2 py-2.5">
                                Gender
                              </th>
                              {hasDualRatingInitialCols ? (
                                <>
                                  <th scope="col" className="w-24 px-2 py-2.5">
                                    N. Rtg
                                  </th>
                                  <th scope="col" className="w-24 px-2 py-2.5">
                                    I. Rtg
                                  </th>
                                </>
                              ) : (
                                <th scope="col" className="w-24 px-2 py-2.5">
                                  Rating
                                </th>
                              )}
                              <th scope="col" className="w-20 px-2 py-2.5">
                                FED
                              </th>
                              <th scope="col" className="px-2 py-2.5">
                                Club/City
                              </th>
                              <th scope="col" className="w-12 px-2 py-2.5 text-center">
                                Hapus
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {visibleDraftRows.map((row) => (
                              <tr key={row.rowKey} className="hover:bg-slate-50/70">
                                <td className="px-2 py-1.5">
                                  <input
                                    type="number"
                                    min={1}
                                    aria-label={`Nomor awal ${row.name || 'pemain'}`}
                                    value={row.sNo}
                                    onChange={(e) =>
                                      handleUpdateDraftRow(row.rowKey, 'sNo', e.target.value)
                                    }
                                    className="font-mono-tabular h-8 w-14 rounded border border-slate-300 px-1.5 text-center text-xs focus:border-[#0F2342] focus:outline-none"
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="text"
                                    aria-label={`Nama pemain ${row.sNo}`}
                                    value={row.name}
                                    onChange={(e) =>
                                      handleUpdateDraftRow(row.rowKey, 'name', e.target.value)
                                    }
                                    placeholder="Nama lengkap pemain"
                                    className="h-8 w-full min-w-[180px] rounded border border-slate-300 px-2 text-xs font-semibold text-slate-900 focus:border-[#0F2342] focus:outline-none"
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <select
                                    aria-label={`Gender ${row.name || row.sNo}`}
                                    value={row.gender}
                                    onChange={(e) =>
                                      handleUpdateDraftRow(row.rowKey, 'gender', e.target.value)
                                    }
                                    className="h-8 w-full rounded border border-slate-300 bg-white px-1.5 text-xs focus:border-[#0F2342] focus:outline-none"
                                  >
                                    <option value="Putra">Putra</option>
                                    <option value="Putri">Putri</option>
                                    <option value="-">-</option>
                                  </select>
                                </td>
                                {hasDualRatingInitialCols ? (
                                  <>
                                    <td className="px-2 py-1.5">
                                      <input
                                        type="text"
                                        aria-label={`Rating Nasional ${row.name || row.sNo}`}
                                        value={row.nationalRating}
                                        onChange={(e) =>
                                          handleUpdateDraftRow(
                                            row.rowKey,
                                            'nationalRating',
                                            e.target.value
                                          )
                                        }
                                        placeholder="-"
                                        className="font-mono-tabular h-8 w-20 rounded border border-slate-300 px-2 text-center text-xs focus:border-[#0F2342] focus:outline-none"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <input
                                        type="text"
                                        aria-label={`Rating Internasional ${row.name || row.sNo}`}
                                        value={row.internationalRating}
                                        onChange={(e) =>
                                          handleUpdateDraftRow(
                                            row.rowKey,
                                            'internationalRating',
                                            e.target.value
                                          )
                                        }
                                        placeholder="-"
                                        className="font-mono-tabular h-8 w-20 rounded border border-slate-300 px-2 text-center text-xs focus:border-[#0F2342] focus:outline-none"
                                      />
                                    </td>
                                  </>
                                ) : (
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      aria-label={`Rating ${row.name || row.sNo}`}
                                      value={row.rating}
                                      onChange={(e) =>
                                        handleUpdateDraftRow(row.rowKey, 'rating', e.target.value)
                                      }
                                      placeholder="-"
                                      className="font-mono-tabular h-8 w-20 rounded border border-slate-300 px-2 text-center text-xs focus:border-[#0F2342] focus:outline-none"
                                    />
                                  </td>
                                )}
                                <td className="px-2 py-1.5">
                                  <input
                                    type="text"
                                    aria-label={`FED ${row.name || row.sNo}`}
                                    value={row.fed}
                                    onChange={(e) =>
                                      handleUpdateDraftRow(row.rowKey, 'fed', e.target.value)
                                    }
                                    className="font-mono-tabular h-8 w-16 rounded border border-slate-300 px-1.5 text-center text-xs uppercase focus:border-[#0F2342] focus:outline-none"
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="text"
                                    aria-label={`Klub atau wilayah ${row.name || row.sNo}`}
                                    value={row.clubCity}
                                    onChange={(e) =>
                                      handleUpdateDraftRow(row.rowKey, 'clubCity', e.target.value)
                                    }
                                    placeholder="Klub / Kecamatan"
                                    className="h-8 w-full min-w-[130px] rounded border border-slate-300 px-2 text-xs focus:border-[#0F2342] focus:outline-none"
                                  />
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDraftRow(row.rowKey)}
                                    aria-label={`Hapus ${row.name || 'pemain'}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-red-50 hover:text-[#B91C1C]"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {canEditInitialRank && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5">
                      <p className="text-xs font-medium text-slate-600">
                        Mode Admin aktif: Anda dapat mengubah, menambah, atau mengurutkan daftar peringkat awal.
                      </p>
                      <button
                        type="button"
                        onClick={startEditingInitialRank}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#0F2342] bg-white px-3 text-xs font-bold text-[#0F2342] hover:bg-slate-100 whitespace-nowrap"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit Peringkat Awal</span>
                      </button>
                    </div>
                  )}

                  {initialRankings.length === 0 ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      Data peringkat awal belum dipublikasikan untuk turnamen ini.
                    </div>
                  ) : hasDualRatingInitialCols ? (
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                              <th scope="col" className="w-16 px-3 py-2.5 text-center whitespace-nowrap">
                                S. No.
                              </th>
                              <th scope="col" className="px-3 py-2.5">
                                Name
                              </th>
                              <th scope="col" className="w-20 px-3 py-2.5 text-center whitespace-nowrap">
                                Gender
                              </th>
                              <th scope="col" className="w-20 px-3 py-2.5 text-center whitespace-nowrap">
                                N. Rtg
                              </th>
                              <th scope="col" className="w-20 px-3 py-2.5 text-center whitespace-nowrap">
                                I. Rtg
                              </th>
                              <th scope="col" className="w-16 px-3 py-2.5 text-center whitespace-nowrap">
                                FED
                              </th>
                              <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                                Club/City
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {initialRankings.map((row, idx) => (
                              <tr
                                key={`init-ext-${row.sNo}-${row.name}-${idx}`}
                                className="hover:bg-slate-50"
                              >
                                <td className="font-mono-tabular px-3 py-2 text-center font-bold text-[#0F2342]">
                                  {row.sNo}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  <button
                                    type="button"
                                    onClick={() => onSelectAthlete(row.name, tournament.id)}
                                    className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                  >
                                    {row.name}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-center text-slate-700 whitespace-nowrap">
                                  {row.gender ?? '-'}
                                </td>
                                <td className="font-mono-tabular px-3 py-2 text-center text-slate-700">
                                  {row.nationalRating ?? row.rating ?? '-'}
                                </td>
                                <td className="font-mono-tabular px-3 py-2 text-center text-slate-700">
                                  {row.internationalRating ?? '-'}
                                </td>
                                <td className="font-mono-tabular px-3 py-2 text-center text-slate-600">
                                  {row.fed ?? '-'}
                                </td>
                                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                  {row.clubCity ?? row.club ?? '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : hasSingleRatingExtendedCols ? (
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[660px] border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                              <th scope="col" className="w-16 px-3 py-2.5 text-center whitespace-nowrap">
                                S. No.
                              </th>
                              <th scope="col" className="px-3 py-2.5">
                                Name
                              </th>
                              <th scope="col" className="w-20 px-3 py-2.5 text-center whitespace-nowrap">
                                Gender
                              </th>
                              <th scope="col" className="w-20 px-3 py-2.5 text-center whitespace-nowrap">
                                Rating
                              </th>
                              <th scope="col" className="w-16 px-3 py-2.5 text-center whitespace-nowrap">
                                FED
                              </th>
                              <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                                Club/City
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {initialRankings.map((row, idx) => (
                              <tr
                                key={`init-rtg-${row.sNo}-${row.name}-${idx}`}
                                className="hover:bg-slate-50"
                              >
                                <td className="font-mono-tabular px-3 py-2 text-center font-bold text-[#0F2342]">
                                  {row.sNo}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  <button
                                    type="button"
                                    onClick={() => onSelectAthlete(row.name, tournament.id)}
                                    className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                  >
                                    {row.name}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-center text-slate-700 whitespace-nowrap">
                                  {row.gender ?? '-'}
                                </td>
                                <td className="font-mono-tabular px-3 py-2 text-center text-slate-700">
                                  {row.rating ?? row.nationalRating ?? '-'}
                                </td>
                                <td className="font-mono-tabular px-3 py-2 text-center text-slate-600">
                                  {row.fed ?? '-'}
                                </td>
                                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                  {row.clubCity ?? row.club ?? '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : initialRankings.some((row) => row.rating !== undefined || row.fed !== undefined || row.category !== undefined) ? (
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                              <th scope="col" className="w-16 px-3 py-2.5 text-center whitespace-nowrap">
                                S. No.
                              </th>
                              <th scope="col" className="px-3 py-2.5">
                                Name
                              </th>
                              <th scope="col" className="w-20 px-3 py-2.5 text-center whitespace-nowrap">
                                Rating
                              </th>
                              <th scope="col" className="w-16 px-3 py-2.5 text-center whitespace-nowrap">
                                FED
                              </th>
                              <th scope="col" className="w-24 px-3 py-2.5 text-center whitespace-nowrap">
                                Category
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {initialRankings.map((row, idx) => (
                              <tr
                                key={`init-${row.sNo}-${row.name}-${idx}`}
                                className="hover:bg-slate-50"
                              >
                                <td className="font-mono-tabular px-3 py-2 text-center font-bold text-[#0F2342]">
                                  {row.sNo ?? idx + 1}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  <button
                                    type="button"
                                    onClick={() => onSelectAthlete(row.name, tournament.id)}
                                    className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                  >
                                    {row.name}
                                  </button>
                                </td>
                                <td className="font-mono-tabular px-3 py-2 text-center text-slate-700">
                                  {row.rating ?? '-'}
                                </td>
                                <td className="font-mono-tabular px-3 py-2 text-center text-slate-600">
                                  {row.fed ?? '-'}
                                </td>
                                <td className="px-3 py-2 text-center text-slate-700 whitespace-nowrap">
                                  {row.category ?? '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase">
                              <th scope="col" className="w-20 px-3 py-3">
                                No. Awal
                              </th>
                              <th scope="col" className="px-3 py-3">
                                Gelar
                              </th>
                              <th scope="col" className="px-3 py-3">
                                Nama Pemain
                              </th>
                              <th scope="col" className="px-3 py-3">
                                Klub / Kecamatan
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {initialRankings.map((row, idx) => (
                              <tr
                                key={`init-${idx}-${row.name}`}
                                className="hover:bg-slate-50"
                              >
                                <td className="font-mono-tabular px-3 py-2.5 font-bold text-[#0F2342]">
                                  #{row.sNo ?? idx + 1}
                                </td>
                                <td className="px-3 py-2.5">
                                  <TitleBadge title={row.title ?? 'Non-Gelar'} />
                                </td>
                                <td className="px-3 py-2.5 font-semibold text-slate-900">
                                  <button
                                    type="button"
                                    onClick={() => onSelectAthlete(row.name, tournament.id)}
                                    className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                  >
                                    {row.name}
                                  </button>
                                </td>
                                <td className="px-3 py-2.5 text-xs text-slate-600">
                                  {row.club ?? '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : roundNumbers.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Data pairing babak per babak belum tersedia untuk turnamen ini.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="pairing-round-select"
                    className="text-xs font-bold text-[#0F2342] whitespace-nowrap"
                  >
                    Pilih Babak
                  </label>
                  <select
                    id="pairing-round-select"
                    aria-label="Pilih babak pertandingan"
                    value={effectiveRound === 'all' ? 'all' : String(effectiveRound)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedRound(val === 'all' ? 'all' : Number(val));
                    }}
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-[#0F2342] focus:border-[#0F2342] focus:outline-none"
                  >
                    {roundNumbers.map((rnd) => (
                      <option key={rnd} value={rnd}>
                        Babak {rnd}
                      </option>
                    ))}
                    <option value="all">
                      Semua Babak ({roundNumbers.length} Babak)
                    </option>
                  </select>
                </div>
                <p className="font-mono-tabular text-xs font-medium text-slate-600">
                  {effectiveRound === 'all'
                    ? `Menampilkan seluruh ${roundNumbers.length} babak (${tournament.pairings.length} meja)`
                    : `Babak ${effectiveRound} dari ${roundNumbers.length} · ${
                        tournament.pairings.filter((p) => p.round === effectiveRound)
                          .length
                      } meja`}
                </p>
              </div>

              {visibleRoundNumbers.map((rnd) => {
                const matches = tournament.pairings.filter(
                  (p) => p.round === rnd
                );
                const hasDetailedCols = matches.some(
                  (m) =>
                    m.whiteSeed !== undefined ||
                    m.blackSeed !== undefined ||
                    m.whitePoints !== undefined ||
                    m.blackPoints !== undefined
                );
                return (
                  <div
                    key={rnd}
                    className="overflow-hidden rounded-md border border-slate-200"
                  >
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-[#0F2342]">
                      Babak {rnd}
                    </div>
                    {hasDetailedCols ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                              <th scope="col" className="w-11 px-2 py-2 text-center whitespace-nowrap">
                                Bo.
                              </th>
                              <th scope="col" className="w-14 px-2 py-2 text-center whitespace-nowrap">
                                S. No.
                              </th>
                              <th scope="col" className="px-3 py-2">
                                Putih
                              </th>
                              <th scope="col" className="w-11 px-2 py-2 text-center whitespace-nowrap">
                                Pts
                              </th>
                              <th scope="col" className="w-20 px-2 py-2 text-center whitespace-nowrap">
                                Res.
                              </th>
                              <th scope="col" className="w-11 px-2 py-2 text-center whitespace-nowrap">
                                Pts
                              </th>
                              <th scope="col" className="px-3 py-2">
                                Hitam
                              </th>
                              <th scope="col" className="w-14 px-2 py-2 text-center whitespace-nowrap">
                                S. No.
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {matches.map((m) => (
                              <tr key={`${rnd}-${m.board}`} className="hover:bg-slate-50">
                                <td className="font-mono-tabular px-2.5 py-2 text-center font-semibold text-slate-500">
                                  {m.board}
                                </td>
                                <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-600">
                                  {m.whiteSeed ?? '-'}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  {m.whiteTitle && m.whiteTitle !== 'Non-Gelar' && (
                                    <span className="font-mono-tabular mr-1.5 text-[11px] font-bold text-[#0F2342]">
                                      {m.whiteTitle}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onSelectAthlete(m.whiteName, tournament.id)}
                                    className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                  >
                                    {m.whiteName}
                                  </button>
                                </td>
                                <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-700">
                                  {m.whitePoints ?? '-'}
                                </td>
                                <td className="font-mono-tabular px-2.5 py-2 text-center font-bold text-[#0F2342] whitespace-nowrap">
                                  {m.result === '*' ? 'Berlangsung' : m.result}
                                </td>
                                <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-700">
                                  {m.blackPoints ?? '-'}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  {m.blackTitle && m.blackTitle !== 'Non-Gelar' && (
                                    <span className="font-mono-tabular mr-1.5 text-[11px] font-bold text-[#0F2342]">
                                      {m.blackTitle}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onSelectAthlete(m.blackName, tournament.id)}
                                    className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                  >
                                    {m.blackName}
                                  </button>
                                </td>
                                <td className="font-mono-tabular px-2.5 py-2 text-center text-slate-600">
                                  {m.blackSeed ?? '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-500">
                            <th scope="col" className="px-3 py-2 w-14">
                              Meja
                            </th>
                            <th scope="col" className="px-3 py-2">
                              Buah Putih
                            </th>
                            <th scope="col" className="px-3 py-2 text-center">
                              Hasil
                            </th>
                            <th scope="col" className="px-3 py-2 text-right">
                              Buah Hitam
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {matches.map((m) => (
                            <tr key={`${rnd}-${m.board}`}>
                              <td className="font-mono-tabular px-3 py-2.5 font-semibold text-slate-500">
                                {m.board}
                              </td>
                              <td className="px-3 py-2.5 font-semibold text-slate-900">
                                {m.whiteTitle && m.whiteTitle !== 'Non-Gelar' && (
                                  <span className="font-mono-tabular mr-1.5 text-[11px] font-bold text-[#0F2342]">
                                    {m.whiteTitle}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onSelectAthlete(m.whiteName, tournament.id)}
                                  className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                >
                                  {m.whiteName}
                                </button>
                              </td>
                              <td className="font-mono-tabular px-3 py-2.5 text-center font-bold text-[#0F2342]">
                                {m.result === '*' ? 'Berlangsung' : m.result}
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                                {m.blackTitle && m.blackTitle !== 'Non-Gelar' && (
                                  <span className="font-mono-tabular mr-1.5 text-[11px] font-bold text-[#0F2342]">
                                    {m.blackTitle}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onSelectAthlete(m.blackName, tournament.id)}
                                  className="text-right font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                                >
                                  {m.blackName}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
