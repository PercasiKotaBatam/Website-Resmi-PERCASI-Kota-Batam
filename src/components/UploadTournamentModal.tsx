import { Download, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  StandingEntry,
  TimeControlCategory,
  Tournament,
  TournamentStatus,
} from '../types/chess';
import {
  generateSampleCsvTemplate,
  generateSampleExcelBytes,
  parseStandingsCsv,
  parseStandingsExcelBuffer,
  parseStandingsJson,
} from '../utils/portalLogic';
import { downloadBinaryFile, downloadTextFile } from '../utils/storage';

interface UploadTournamentModalProps {
  isOpen: boolean;
  editingTournament?: Tournament | null;
  onClose: () => void;
  onSaveTournament: (tournament: Tournament, isEdit: boolean) => void;
}

type StandingExtraMeta = Pick<
  StandingEntry,
  'sNo' | 'rating' | 'fed' | 'category' | 'de' | 'sb' | 'ps'
>;

interface EditableRow {
  rank: string;
  title: string;
  name: string;
  club: string;
  points: string;
  buchholz: string;
  ratingChange: string;
  meta?: StandingExtraMeta;
}

const DEFAULT_ROW: EditableRow = {
  rank: '1',
  title: 'FM',
  name: '',
  club: 'Semanggi Chess Club',
  points: '5.0',
  buchholz: '24.5',
  ratingChange: '8',
};

export function UploadTournamentModal({
  isOpen,
  editingTournament = null,
  onClose,
  onSaveTournament,
}: UploadTournamentModalProps) {
  const [inputMethod, setInputMethod] = useState<'file' | 'table'>('file');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<TournamentStatus>('Selesai');
  const [venue, setVenue] = useState('Kepri Mall Batam');
  const [startDate, setStartDate] = useState('22 Nov 2026');
  const [endDate, setEndDate] = useState('23 Nov 2026');
  const [timeControlCategory, setTimeControlCategory] =
    useState<TimeControlCategory>('Rapid');
  const [timeControlDetail, setTimeControlDetail] = useState('15 menit + 10 detik');
  const [rounds, setRounds] = useState('7');
  const [chiefArbiter, setChiefArbiter] = useState('WN Agus Kurniawan, FA');
  const [description, setDescription] = useState('');

  const [rawText, setRawText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedStandings, setParsedStandings] = useState<StandingEntry[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const [rows, setRows] = useState<EditableRow[]>([
    { ...DEFAULT_ROW, rank: '1' },
    { ...DEFAULT_ROW, rank: '2', title: 'NM', points: '4.5', buchholz: '23.0', ratingChange: '4' },
  ]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingTournament) {
      setInputMethod('table');
      setName(editingTournament.name);
      setStatus(editingTournament.status);
      setVenue(editingTournament.venue);
      setStartDate(editingTournament.startDate);
      setEndDate(editingTournament.endDate);
      setTimeControlCategory(editingTournament.timeControlCategory);
      setTimeControlDetail(editingTournament.timeControlDetail);
      setRounds(String(editingTournament.rounds));
      setChiefArbiter(editingTournament.chiefArbiter);
      setDescription(editingTournament.description);
      setRows(
        editingTournament.standings.map((s) => ({
          rank: String(s.rank),
          title: s.title,
          name: s.name,
          club: s.club,
          points: String(s.points),
          buchholz: String(s.buchholz),
          ratingChange: String(s.ratingChange),
          meta: {
            sNo: s.sNo,
            rating: s.rating,
            fed: s.fed,
            category: s.category,
            de: s.de,
            sb: s.sb,
            ps: s.ps,
          },
        }))
      );
    } else {
      setInputMethod('file');
      setName('');
      setStatus('Selesai');
      setVenue('Kepri Mall Batam');
      setStartDate('22 Nov 2026');
      setEndDate('23 Nov 2026');
      setTimeControlCategory('Rapid');
      setTimeControlDetail('15 menit + 10 detik');
      setRounds('7');
      setChiefArbiter('WN Agus Kurniawan, FA');
      setDescription('');
      setRows([
        { ...DEFAULT_ROW, rank: '1' },
        { ...DEFAULT_ROW, rank: '2', title: 'NM', points: '4.5', buchholz: '23.0', ratingChange: '4' },
      ]);
    }
    setRawText('');
    setUploadedFileName('');
    setParsedStandings([]);
    setParseErrors([]);
    setFormError('');
  }, [isOpen, editingTournament]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parseRawInput = (text: string, isJsonHint = false) => {
    setRawText(text);
    setUploadedFileName('');
    if (!text.trim()) {
      setParsedStandings([]);
      setParseErrors([]);
      return;
    }
    const trimmed = text.trim();
    const result =
      isJsonHint || trimmed.startsWith('{') || trimmed.startsWith('[')
        ? parseStandingsJson(trimmed)
        : parseStandingsCsv(trimmed);
    setParsedStandings(result.standings);
    setParseErrors(result.errors);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lowerName = file.name.toLowerCase();

    try {
      if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) {
        const buffer = await file.arrayBuffer();
        const result = parseStandingsExcelBuffer(buffer);
        setUploadedFileName(file.name);
        setRawText('');
        setParsedStandings(result.standings);
        setParseErrors(result.errors);
        return;
      }

      const text = await file.text();
      const isJson = lowerName.endsWith('.json');
      parseRawInput(text, isJson);
      setUploadedFileName(file.name);
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    downloadTextFile(
      'template-hasil-swiss-manager-percasi-batam.csv',
      generateSampleCsvTemplate(),
      'text/csv;charset=utf-8'
    );
  };

  const handleDownloadExcelTemplate = () => {
    downloadBinaryFile(
      'template-hasil-swiss-manager-percasi-batam.xlsx',
      generateSampleExcelBytes(),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  const handleUseSampleInPreview = () => {
    parseRawInput(generateSampleCsvTemplate(), false);
  };

  const updateRow = (idx: number, field: keyof EditableRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        ...DEFAULT_ROW,
        rank: String(prev.length + 1),
        title: 'Non-Gelar',
        points: '3.0',
        buchholz: '20.0',
        ratingChange: '0',
      },
    ]);
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama turnamen wajib diisi.');
      return;
    }
    if (!venue.trim() || !chiefArbiter.trim()) {
      setFormError('Lokasi venue dan nama Wasit Utama wajib diisi.');
      return;
    }

    let finalStandings: StandingEntry[] = [];

    if (inputMethod === 'file') {
      if (parseErrors.length > 0) {
        setFormError('Perbaiki kesalahan format Excel/CSV/JSON sebelum menyimpan.');
        return;
      }
      if (parsedStandings.length > 0) {
        finalStandings = parsedStandings;
      } else if (editingTournament && !rawText.trim() && !uploadedFileName) {
        finalStandings = editingTournament.standings;
      } else {
        setFormError(
          'Unggah berkas Excel (.xls/.xlsx), CSV/JSON, atau tempel data klasemen terlebih dahulu.'
        );
        return;
      }
    } else {
      const validRows = rows.filter((r) => r.name.trim());
      if (validRows.length === 0 && (!editingTournament || status !== 'Akan Datang')) {
        setFormError(
          'Masukkan minimal satu pemain pada tabel klasemen interaktif.'
        );
        return;
      }
      finalStandings = validRows.map((r, idx) => {
        const pts = Number.parseFloat(r.points) || 0;
        const bh = Number.parseFloat(r.buchholz) || 0;
        return {
          ...(r.meta ?? {}),
          rank: Number.parseInt(r.rank, 10) || idx + 1,
          title: r.title.trim() || 'Non-Gelar',
          name: r.name.trim(),
          club: r.club.trim() || 'Batam',
          points: pts,
          pointsDisplay: Number.isInteger(pts) ? String(pts) : pts.toFixed(1),
          buchholz: bh,
          bhDisplay: Number.isInteger(bh) ? String(bh) : bh.toFixed(1),
          ratingChange: Number.parseInt(r.ratingChange, 10) || 0,
        };
      });
      finalStandings.sort((a, b) => a.rank - b.rank);
    }

    const isEdit = Boolean(editingTournament);
    const savedTournament: Tournament = {
      id: editingTournament?.id ?? `trn-${Date.now()}`,
      name: name.trim(),
      status,
      startDate: startDate.trim() || '22 Nov 2026',
      endDate: endDate.trim() || startDate.trim() || '23 Nov 2026',
      venue: venue.trim(),
      timeControlCategory,
      timeControlDetail: timeControlDetail.trim() || timeControlCategory,
      rounds: Number.parseInt(rounds, 10) || 7,
      chiefArbiter: chiefArbiter.trim(),
      organizer: editingTournament?.organizer ?? 'Pengkot PERCASI Kota Batam',
      participantsCount: finalStandings.length,
      description: isEdit
        ? description.trim()
        : description.trim() ||
          `Turnamen resmi ${timeControlCategory} di ${venue.trim()} di bawah pengawasan Wasit Utama ${chiefArbiter.trim()}.`,
      standings: finalStandings,
      pairings: editingTournament?.pairings ?? [],
    };

    onSaveTournament(savedTournament, isEdit);
    setName('');
    setDescription('');
    setRawText('');
    setUploadedFileName('');
    setParsedStandings([]);
    setParseErrors([]);
    setFormError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-tournament-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2
            id="upload-tournament-title"
            className="text-lg font-extrabold text-[#0F2342]"
          >
            {editingTournament
              ? `Edit Turnamen: ${editingTournament.name}`
              : 'Buat Turnamen & Upload Hasil Pertandingan'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal upload hasil turnamen"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {formError && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-[#B91C1C]"
            >
              {formError}
            </div>
          )}

          {/* Tournament Metadata */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="trn-name"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nama Turnamen *
              </label>
              <input
                id="trn-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Batam Open Rapid Championship 2026"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="trn-status"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Status
              </label>
              <select
                id="trn-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              >
                <option value="Selesai">Selesai</option>
                <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                <option value="Akan Datang">Akan Datang</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="trn-venue"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Lokasi / Venue *
              </label>
              <input
                id="trn-venue"
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="trn-dates"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tanggal Mulai / Selesai
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="trn-dates"
                  type="text"
                  aria-label="Tanggal mulai"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 px-2.5 text-xs focus:border-[#0F2342] focus:outline-none"
                />
                <input
                  type="text"
                  aria-label="Tanggal selesai"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 px-2.5 text-xs focus:border-[#0F2342] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="trn-arbiter"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Wasit Utama *
              </label>
              <input
                id="trn-arbiter"
                type="text"
                required
                value={chiefArbiter}
                onChange={(e) => setChiefArbiter(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="trn-tc-cat"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kategori Kontrol Waktu
              </label>
              <select
                id="trn-tc-cat"
                value={timeControlCategory}
                onChange={(e) =>
                  setTimeControlCategory(e.target.value as TimeControlCategory)
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              >
                <option value="Catur Cepat">Catur Cepat</option>
                <option value="Standard">Standard</option>
                <option value="Rapid">Rapid</option>
                <option value="Blitz">Blitz</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="trn-tc-detail"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Detail Kontrol Waktu
              </label>
              <input
                id="trn-tc-detail"
                type="text"
                value={timeControlDetail}
                onChange={(e) => setTimeControlDetail(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="trn-rounds"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Jumlah Babak
              </label>
              <input
                id="trn-rounds"
                type="number"
                min={3}
                max={15}
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                className="font-mono-tabular h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>
          </div>

          {/* Method Switch */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Metode input hasil turnamen"
                className="inline-flex rounded-md bg-slate-100 p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMethod === 'file'}
                  onClick={() => setInputMethod('file')}
                  className={`h-9 rounded px-4 text-xs font-bold transition-colors ${
                    inputMethod === 'file'
                      ? 'bg-[#0F2342] text-white'
                      : 'text-slate-700 hover:text-[#0F2342]'
                  }`}
                >
                  Upload Excel / CSV / JSON
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMethod === 'table'}
                  onClick={() => setInputMethod('table')}
                  className={`h-9 rounded px-4 text-xs font-bold transition-colors ${
                    inputMethod === 'table'
                      ? 'bg-[#0F2342] text-white'
                      : 'text-slate-700 hover:text-[#0F2342]'
                  }`}
                >
                  Input Tabel Interaktif
                </button>
              </div>

              {inputMethod === 'file' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Unduh Template Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Unduh Template CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUseSampleInPreview}
                    className="inline-flex h-9 items-center rounded-md border border-[#0F2342] px-3 text-xs font-semibold text-[#0F2342] hover:bg-slate-50"
                  >
                    Muat Contoh CSV
                  </button>
                </div>
              )}
            </div>

            {inputMethod === 'file' ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
                  <label
                    htmlFor="standings-file-input"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 py-2 text-center"
                  >
                    <Upload className="h-6 w-6 text-[#0F2342]" aria-hidden="true" />
                    <span className="text-xs font-bold text-[#0F2342]">
                      Pilih berkas Excel (.xls / .xlsx), CSV, atau JSON hasil ekspor Swiss-Manager
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Mendukung Microsoft Excel (.xls, .xlsx), CSV pemisah koma (,) / titik koma (;), serta JSON
                    </span>
                    {uploadedFileName && (
                      <span className="mt-1 rounded bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        Berkas dimuat: {uploadedFileName}
                      </span>
                    )}
                  </label>
                  <input
                    id="standings-file-input"
                    type="file"
                    accept=".xls,.xlsx,.csv,.json,.txt"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </div>

                <div>
                  <label
                    htmlFor="standings-raw-textarea"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Atau Tempel Langsung Data CSV / JSON
                  </label>
                  <textarea
                    id="standings-raw-textarea"
                    rows={5}
                    value={rawText}
                    onChange={(e) => parseRawInput(e.target.value, false)}
                    placeholder="Peringkat,Gelar,Nama,Klub,Poin,Buchholz,PerubahanRating&#10;1,NM,Godfrid Harry Mollyson Siregar,Semanggi Chess Club,6.5,31.5,14"
                    className="font-mono-tabular w-full rounded-md border border-slate-300 p-3 text-xs focus:border-[#0F2342] focus:outline-none"
                  />
                </div>

                {parseErrors.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-[#B91C1C]">
                    <p className="font-bold">Ditemukan kesalahan parsing:</p>
                    <ul className="mt-1 list-disc pl-4">
                      {parseErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {parsedStandings.length > 0 && (
                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#0F2342]">
                      Pratinjau Klasemen Tervalidasi ({parsedStandings.length} Pemain)
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-white text-slate-500">
                            <th className="px-3 py-2">Pos</th>
                            <th className="px-3 py-2">Gelar</th>
                            <th className="px-3 py-2">Nama</th>
                            <th className="px-3 py-2">Klub</th>
                            <th className="px-3 py-2 text-right">Poin</th>
                            <th className="px-3 py-2 text-right">TB/BH</th>
                            <th className="px-3 py-2 text-right">+/-</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedStandings.map((row, idx) => (
                            <tr key={idx}>
                              <td className="font-mono-tabular px-3 py-1.5 font-bold">
                                #{row.rank}
                              </td>
                              <td className="font-mono-tabular px-3 py-1.5">
                                {row.title}
                              </td>
                              <td className="px-3 py-1.5 font-semibold">
                                {row.name}
                              </td>
                              <td className="px-3 py-1.5 text-slate-600">
                                {row.club}
                              </td>
                              <td className="font-mono-tabular px-3 py-1.5 text-right font-bold">
                                {row.points.toFixed(1)}
                              </td>
                              <td className="font-mono-tabular px-3 py-1.5 text-right">
                                {row.buchholz.toFixed(1)}
                              </td>
                              <td className="font-mono-tabular px-3 py-1.5 text-right">
                                {row.ratingChange}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-md border border-slate-200">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600">
                        <th className="px-2 py-2 w-14">Pos</th>
                        <th className="px-2 py-2 w-24">Gelar</th>
                        <th className="px-2 py-2">Nama Pemain *</th>
                        <th className="px-2 py-2">Klub / Kecamatan</th>
                        <th className="px-2 py-2 w-20">Poin</th>
                        <th className="px-2 py-2 w-20">Buchholz</th>
                        <th className="px-2 py-2 w-20">+/- Rtg</th>
                        <th className="px-2 py-2 w-10">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5">
                            <input
                              type="number"
                              aria-label={`Peringkat baris ${idx + 1}`}
                              value={row.rank}
                              onChange={(e) => updateRow(idx, 'rank', e.target.value)}
                              className="font-mono-tabular h-8 w-full rounded border border-slate-300 px-2 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              aria-label={`Gelar baris ${idx + 1}`}
                              value={row.title}
                              onChange={(e) => updateRow(idx, 'title', e.target.value)}
                              className="h-8 w-full rounded border border-slate-300 px-2 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              aria-label={`Nama pemain baris ${idx + 1}`}
                              value={row.name}
                              onChange={(e) => updateRow(idx, 'name', e.target.value)}
                              placeholder="Nama atlet..."
                              className="h-8 w-full rounded border border-slate-300 px-2 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              aria-label={`Klub baris ${idx + 1}`}
                              value={row.club}
                              onChange={(e) => updateRow(idx, 'club', e.target.value)}
                              className="h-8 w-full rounded border border-slate-300 px-2 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.5"
                              aria-label={`Poin baris ${idx + 1}`}
                              value={row.points}
                              onChange={(e) => updateRow(idx, 'points', e.target.value)}
                              className="font-mono-tabular h-8 w-full rounded border border-slate-300 px-2 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.5"
                              aria-label={`Buchholz baris ${idx + 1}`}
                              value={row.buchholz}
                              onChange={(e) => updateRow(idx, 'buchholz', e.target.value)}
                              className="font-mono-tabular h-8 w-full rounded border border-slate-300 px-2 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              aria-label={`Perubahan rating baris ${idx + 1}`}
                              value={row.ratingChange}
                              onChange={(e) =>
                                updateRow(idx, 'ratingChange', e.target.value)
                              }
                              className="font-mono-tabular h-8 w-full rounded border border-slate-300 px-2 text-xs"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              aria-label={`Hapus baris ${idx + 1}`}
                              disabled={rows.length <= 1}
                              className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-[#B91C1C] disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tambah Baris Pemain</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="trn-desc"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Catatan / Deskripsi Singkat Turnamen (Opsional)
            </label>
            <textarea
              id="trn-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ringkasan penyelenggaraan, sponsor lokal, atau kategori yang dipertandingkan..."
              className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-[#0F2342] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md bg-[#0F2342] px-5 text-xs font-bold text-white hover:bg-[#173360]"
            >
              {editingTournament ? 'Simpan Perubahan' : 'Publikasikan Hasil Turnamen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
