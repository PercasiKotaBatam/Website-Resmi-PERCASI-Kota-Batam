import * as XLSX from 'xlsx';
import type {
  ArbiterTitleCode,
  Athlete,
  AthleteCategory,
  BatamDistrict,
  CoachTitleCode,
  InitialRankEntry,
  KepriCity,
  PortalData,
  RatingCategory,
  RoundPairing,
  StandingEntry,
  TitleCode,
  Tournament,
} from '../types/chess';

export interface AthleteFilterOptions {
  query?: string;
  title?: TitleCode | 'Semua';
  coachTitle?: CoachTitleCode | 'Semua';
  arbiterTitle?: ArbiterTitleCode | 'Semua';
  category?: AthleteCategory | 'Semua';
  city?: KepriCity | 'Semua';
  district?: BatamDistrict | 'Semua';
}

export type RatingSortField = 'rating' | 'name';
export type SortDirection = 'asc' | 'desc';

export const TITLE_OPTIONS: TitleCode[] = [
  'GM',
  'IM',
  'FM',
  'WFM',
  'NM',
  'MP',
  'AGM',
  'AIM',
  'AFM',
  'ACM',
  'Non-Gelar',
];

export const COACH_TITLE_OPTIONS: CoachTitleCode[] = [
  'FST',
  'FT',
  'FI',
  'NI',
  'DI',
  'PN',
  'PNM',
  'PNP',
];

export const ARBITER_TITLE_OPTIONS: ArbiterTitleCode[] = [
  'IA',
  'FA',
  'NA',
  'WN',
  'WNM',
  'WNP',
];

export const CATEGORY_OPTIONS: AthleteCategory[] = [
  'Senior Putra',
  'Senior Putri',
  'Junior U-18',
  'Junior U-14',
  'Veteran',
];

export const CITY_OPTIONS: KepriCity[] = [
  'Anambas',
  'Bintan',
  'Karimun',
  'Kota Batam',
  'Lingga',
  'Natuna',
  'Tanjung Pinang',
];

export const DISTRICT_OPTIONS: BatamDistrict[] = [
  'Batam Kota',
  'Sekupang',
  'Lubuk Baja',
  'Batu Aji',
  'Bengkong',
  'Nongsa',
  'Sungai Beduk',
  'Sagulung',
];

export function inferAthleteCity(rawValue?: string): KepriCity {
  const lower = (rawValue ?? '').trim().toLowerCase();
  if (!lower) return 'Kota Batam';
  if (lower.includes('tanjung pinang') || lower.includes('tanjungpinang')) {
    return 'Tanjung Pinang';
  }
  if (lower.includes('anambas')) return 'Anambas';
  if (lower.includes('bintan')) return 'Bintan';
  if (lower.includes('karimun')) return 'Karimun';
  if (lower.includes('lingga')) return 'Lingga';
  if (lower.includes('natuna')) return 'Natuna';
  return 'Kota Batam';
}

export function mapClubCityToAthleteLocation(rawClubCity?: string): {
  city: KepriCity;
  district: Athlete['district'];
  club: string;
} {
  const raw = (rawClubCity ?? '').trim();
  const lower = raw.toLowerCase();
  if (lower.includes('tanjung pinang') || lower.includes('tanjungpinang')) {
    return { city: 'Tanjung Pinang', district: '-', club: '-' };
  }
  if (lower.includes('bintan')) {
    return { city: 'Bintan', district: '-', club: '-' };
  }
  if (lower.includes('lingga')) {
    return { city: 'Lingga', district: '-', club: '-' };
  }
  if (lower.includes('karimun')) {
    return { city: 'Karimun', district: '-', club: '-' };
  }
  if (lower.includes('natuna')) {
    return { city: 'Natuna', district: '-', club: '-' };
  }
  if (lower.includes('anambas')) {
    return { city: 'Anambas', district: '-', club: '-' };
  }
  if (lower === 'sagulung' || lower === 'kec. sagulung') {
    return { city: 'Kota Batam', district: 'Sagulung', club: '-' };
  }
  if (lower === 'sekupang' || lower === 'kec. sekupang') {
    return { city: 'Kota Batam', district: 'Sekupang', club: '-' };
  }
  if (lower === 'batu aji' || lower === 'kec. batu aji') {
    return { city: 'Kota Batam', district: 'Batu Aji', club: '-' };
  }
  if (lower === 'lubuk baja' || lower === 'kec. lubuk baja') {
    return { city: 'Kota Batam', district: 'Lubuk Baja', club: '-' };
  }
  if (lower === 'batam kota' || lower === 'kec. batam kota') {
    return { city: 'Kota Batam', district: 'Batam Kota', club: '-' };
  }
  if (
    lower === 'sei beduk' ||
    lower === 'sungai beduk' ||
    lower === 'kec. sungai beduk' ||
    lower === 'kec. sei beduk'
  ) {
    return { city: 'Kota Batam', district: 'Sungai Beduk', club: '-' };
  }
  if (lower === 'bengkong' || lower === 'kec. bengkong') {
    return { city: 'Kota Batam', district: 'Bengkong', club: '-' };
  }
  if (lower === 'nongsa' || lower === 'kec. nongsa') {
    return { city: 'Kota Batam', district: 'Nongsa', club: '-' };
  }
  if (lower === 'junior' || lower === 'batu ampar' || !raw || raw === '-') {
    return { city: 'Kota Batam', district: 'Batam Kota', club: '-' };
  }
  return { city: 'Kota Batam', district: 'Batam Kota', club: raw };
}

export function getAthleteCity(
  athlete: Pick<Athlete, 'city' | 'club'>
): KepriCity {
  if (athlete.city && CITY_OPTIONS.includes(athlete.city)) {
    return athlete.city;
  }
  return inferAthleteCity(athlete.club);
}

export function formatAthleteLocation(athlete: {
  club?: string;
  city?: string;
  district?: string;
}): string {
  const city = athlete.city || 'Kota Batam';
  const parts: string[] = [];
  if (athlete.club && athlete.club !== '-') {
    parts.push(athlete.club);
  }
  if (
    city === 'Kota Batam' &&
    athlete.district &&
    athlete.district !== '-'
  ) {
    parts.push(`Kec. ${athlete.district}`);
  }
  parts.push(city);
  return parts.join(' · ');
}

export function filterAthletes(
  athletes: Athlete[],
  options: AthleteFilterOptions
): Athlete[] {
  const normalizedQuery = (options.query ?? '').trim().toLowerCase();

  return athletes.filter((athlete) => {
    const city = getAthleteCity(athlete);
    if (options.title && options.title !== 'Semua' && athlete.title !== options.title) {
      return false;
    }
    if (
      options.coachTitle &&
      options.coachTitle !== 'Semua' &&
      athlete.coachTitle !== options.coachTitle
    ) {
      return false;
    }
    if (
      options.arbiterTitle &&
      options.arbiterTitle !== 'Semua' &&
      athlete.arbiterTitle !== options.arbiterTitle
    ) {
      return false;
    }
    if (
      options.category &&
      options.category !== 'Semua' &&
      athlete.category !== options.category
    ) {
      return false;
    }
    if (options.city && options.city !== 'Semua' && city !== options.city) {
      return false;
    }
    if (
      options.district &&
      options.district !== 'Semua' &&
      athlete.district !== options.district
    ) {
      return false;
    }
    if (normalizedQuery) {
      const searchable = [
        athlete.fullName,
        athlete.club,
        city,
        athlete.district !== '-' ? athlete.district : '',
        athlete.title,
        athlete.coachTitle ?? '',
        athlete.arbiterTitle ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });
}

export function sortRatings(
  athletes: Athlete[],
  ratingCategory: RatingCategory,
  sortBy: RatingSortField = 'rating',
  sortDir: SortDirection = 'desc'
): Athlete[] {
  const multiplier = sortDir === 'asc' ? 1 : -1;
  return [...athletes].sort((a, b) => {
    if (sortBy === 'rating') {
      const diff = a.ratings[ratingCategory] - b.ratings[ratingCategory];
      if (diff !== 0) return diff * multiplier;
      return a.fullName.localeCompare(b.fullName, 'id');
    }
    return a.fullName.localeCompare(b.fullName, 'id') * multiplier;
  });
}

export function getTopAthletes(
  athletes: Athlete[],
  ratingCategory: RatingCategory,
  limit = 5
): Athlete[] {
  return sortRatings(athletes, ratingCategory, 'rating', 'desc').slice(0, limit);
}

export function formatRatingDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return '0';
}

export function getInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'PB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function filterTournaments(
  tournaments: Tournament[],
  query: string,
  status: Tournament['status'] | 'Semua' = 'Semua'
): Tournament[] {
  const q = query.trim().toLowerCase();
  return tournaments.filter((t) => {
    if (status !== 'Semua' && t.status !== status) return false;
    if (!q) return true;
    return [t.name, t.venue, t.chiefArbiter, t.timeControlCategory]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

export interface StandingsParseResult {
  standings: StandingEntry[];
  errors: string[];
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseStandingsCsv(csvText: string): StandingsParseResult {
  const rawLines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return { standings: [], errors: ['Berkas CSV kosong atau tidak memiliki baris data.'] };
  }

  const headerLine = rawLines[0];
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semiCount = (headerLine.match(/;/g) ?? []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const headers = splitDelimitedLine(headerLine, delimiter).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  const hasHeaderRow = headers.some((h) =>
    ['nama', 'name', 'pemain', 'player', 'rank', 'peringkat', 'pts', 'poin', 'points'].includes(
      h
    )
  );

  const findIdx = (candidates: string[], fallback: number): number => {
    if (!hasHeaderRow) return fallback;
    const idx = headers.findIndex((h) => candidates.some((c) => h.includes(c)));
    return idx >= 0 ? idx : -1;
  };

  const rankIdx = findIdx(['peringkat', 'rank', 'rk', 'no', 'pos'], 0);
  const titleIdx = findIdx(['gelar', 'title', 'tit'], 1);
  const nameIdx = findIdx(['nama', 'name', 'pemain', 'player'], 2);
  const clubIdx = findIdx(['klub', 'club', 'kecamatan', 'fed', 'kota'], 3);
  const pointsIdx = findIdx(['poin', 'points', 'pts', 'skor', 'score'], 4);
  const buchholzIdx = findIdx(['buchholz', 'tb1', 'tb', 'tiebreak', 'bh'], 5);
  const deltaIdx = findIdx(['perubahan', 'ratingchange', 'delta', 'chg', 'elo'], 6);
  const idIdx = findIdx(['percasiid', 'idpercasi', 'fideid', 'id'], -1);

  const dataLines = hasHeaderRow ? rawLines.slice(1) : rawLines;
  if (dataLines.length === 0) {
    return {
      standings: [],
      errors: ['CSV hanya berisi baris judul kolom tanpa data peringkat pemain.'],
    };
  }

  const standings: StandingEntry[] = [];
  const errors: string[] = [];

  dataLines.forEach((line, idx) => {
    const rowNumber = hasHeaderRow ? idx + 2 : idx + 1;
    const cols = splitDelimitedLine(line, delimiter);
    const name = nameIdx >= 0 ? (cols[nameIdx] ?? '').trim() : '';

    if (!name) {
      errors.push(`Baris ${rowNumber}: Nama pemain wajib diisi.`);
      return;
    }

    const parsedRank =
      rankIdx >= 0 && cols[rankIdx]
        ? Number.parseInt(cols[rankIdx], 10)
        : standings.length + 1;
    const parsedPoints =
      pointsIdx >= 0 && cols[pointsIdx]
        ? Number.parseFloat(cols[pointsIdx].replace(',', '.'))
        : 0;
    const parsedBuchholz =
      buchholzIdx >= 0 && cols[buchholzIdx]
        ? Number.parseFloat(cols[buchholzIdx].replace(',', '.'))
        : 0;
    const parsedDelta =
      deltaIdx >= 0 && cols[deltaIdx]
        ? Number.parseInt(cols[deltaIdx].replace('+', ''), 10)
        : 0;

    if (Number.isNaN(parsedPoints)) {
      errors.push(`Baris ${rowNumber}: Nilai poin "${cols[pointsIdx]}" tidak valid.`);
      return;
    }

    const rawTitle = titleIdx >= 0 ? (cols[titleIdx] ?? '').trim() : '';
    const club = clubIdx >= 0 ? (cols[clubIdx] ?? '').trim() || 'Batam' : 'Batam';
    const percasiId = idIdx >= 0 ? (cols[idIdx] ?? '').trim() || undefined : undefined;

    standings.push({
      rank: Number.isNaN(parsedRank) ? standings.length + 1 : parsedRank,
      title: rawTitle || 'Non-Gelar',
      name,
      club,
      points: parsedPoints,
      buchholz: Number.isNaN(parsedBuchholz) ? 0 : parsedBuchholz,
      ratingChange: Number.isNaN(parsedDelta) ? 0 : parsedDelta,
      percasiId,
    });
  });

  standings.sort((a, b) => a.rank - b.rank);
  return { standings, errors };
}

export function parseStandingsJson(jsonText: string): StandingsParseResult {
  try {
    const parsed: unknown = JSON.parse(jsonText);
    const list = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' &&
          parsed !== null &&
          'standings' in parsed &&
          Array.isArray((parsed as { standings: unknown }).standings)
        ? (parsed as { standings: unknown[] }).standings
        : null;

    if (!list) {
      return {
        standings: [],
        errors: ['Format JSON harus berupa array pemain atau objek dengan properti "standings".'],
      };
    }

    const standings: StandingEntry[] = [];
    const errors: string[] = [];

    list.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`Entri ke-${index + 1} bukan objek yang valid.`);
        return;
      }
      const record = item as Record<string, unknown>;
      const name = String(record.name ?? record.nama ?? '').trim();
      if (!name) {
        errors.push(`Entri ke-${index + 1}: Properti "name" wajib diisi.`);
        return;
      }
      const rank = Number(record.rank ?? record.peringkat ?? index + 1);
      const points = Number(record.points ?? record.poin ?? 0);
      const buchholz = Number(record.buchholz ?? record.tb1 ?? 0);
      const ratingChange = Number(record.ratingChange ?? record.perubahan ?? 0);
      const title = String(record.title ?? record.gelar ?? 'Non-Gelar').trim() || 'Non-Gelar';
      const club = String(record.club ?? record.klub ?? 'Batam').trim() || 'Batam';
      const percasiId = record.percasiId ? String(record.percasiId).trim() : undefined;

      standings.push({
        rank: Number.isFinite(rank) ? rank : index + 1,
        title,
        name,
        club,
        points: Number.isFinite(points) ? points : 0,
        buchholz: Number.isFinite(buchholz) ? buchholz : 0,
        ratingChange: Number.isFinite(ratingChange) ? ratingChange : 0,
        percasiId,
      });
    });

    standings.sort((a, b) => a.rank - b.rank);
    return { standings, errors };
  } catch {
    return { standings: [], errors: ['Berkas JSON tidak dapat diurai. Periksa sintaks JSON Anda.'] };
  }
}

export function generateSampleCsvTemplate(): string {
  return [
    'Peringkat,Gelar,Nama,Klub,Poin,Buchholz,PerubahanRating',
    '1,NM,Godfrid Harry Mollyson Siregar,Semanggi Chess Club,6.5,31.5,14',
    '2,NM,Nurdin Simanjuntak,-,6.0,30.0,10',
    '3,NM,Sahat Sitanggang,-,5.5,29.5,8',
    '4,MP,Suhandri,-,5.0,28.0,5',
    '5,Non-Gelar,Hadi Hartoni Sembiring,-,4.5,27.5,6',
    '6,Non-Gelar,Jon Toni,Semanggi Chess Club,4.0,25.0,4',
  ].join('\n');
}

function parseNumericScore(raw: unknown): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : Number.NaN;
  }
  const str = String(raw ?? '')
    .trim()
    .replace(/½/g, '.5')
    .replace(',', '.');
  if (!str) return Number.NaN;
  if (str === '.5') return 0.5;
  return Number.parseFloat(str);
}

function normalizeHeaderToken(cell: unknown): string {
  return String(cell ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function parseStandingsMatrix(rows: unknown[][]): StandingsParseResult {
  const nonEmptyRows = rows.filter((row) =>
    row.some((cell) => String(cell ?? '').trim() !== '')
  );

  if (nonEmptyRows.length === 0) {
    return {
      standings: [],
      errors: ['Berkas Excel kosong atau tidak memiliki baris data.'],
    };
  }

  let headerRowIdx = nonEmptyRows.findIndex((row) => {
    const tokens = row.map(normalizeHeaderToken);
    const hasNameCol = tokens.some((t) =>
      ['nama', 'name', 'pemain', 'player', 'namapemain'].includes(t)
    );
    const hasMetricCol = tokens.some((t) =>
      ['peringkat', 'rank', 'rk', 'pos', 'pts', 'poin', 'points', 'skor', 'score', 'sno', 'no'].includes(t)
    );
    return hasNameCol && hasMetricCol;
  });

  const hasHeaderRow = headerRowIdx >= 0;
  if (headerRowIdx < 0) {
    headerRowIdx = 0;
  }

  const headers = nonEmptyRows[headerRowIdx].map(normalizeHeaderToken);

  const findExactOrPartialIdx = (
    exactList: string[],
    partialList: string[],
    fallback: number
  ): number => {
    if (!hasHeaderRow) return fallback;
    const exactIdx = headers.findIndex((h) => exactList.includes(h));
    if (exactIdx >= 0) return exactIdx;
    const partialIdx = headers.findIndex((h) =>
      partialList.some((p) => h.includes(p))
    );
    return partialIdx >= 0 ? partialIdx : -1;
  };

  const sNoIdx = findExactOrPartialIdx(['sno', 'noawal', 'seed', 'startno'], ['sno', 'seed'], -1);
  const rankIdx = findExactOrPartialIdx(
    ['peringkat', 'rank', 'rk', 'pos', 'no'],
    ['peringkat', 'rank', 'pos'],
    0
  );
  const titleIdx = findExactOrPartialIdx(['gelar', 'title', 'tit'], ['gelar', 'title'], 1);
  const nameIdx = findExactOrPartialIdx(
    ['nama', 'name', 'pemain', 'player', 'namapemain'],
    ['nama', 'name', 'pemain', 'player'],
    2
  );
  const clubIdx = findExactOrPartialIdx(
    ['klub', 'club', 'kecamatan', 'kota'],
    ['klub', 'club', 'kecamatan', 'kota'],
    3
  );
  const ratingIdx = findExactOrPartialIdx(
    ['rating', 'rtg', 'elo'],
    ['rating', 'rtg'],
    -1
  );
  const fedIdx = findExactOrPartialIdx(['fed', 'federasi'], ['fed'], -1);
  const categoryIdx = findExactOrPartialIdx(
    ['category', 'kategori', 'type', 'kat'],
    ['category', 'kategori'],
    -1
  );
  const pointsIdx = findExactOrPartialIdx(
    ['poin', 'points', 'pts', 'skor', 'score'],
    ['poin', 'pts', 'skor', 'score'],
    4
  );
  const deIdx = findExactOrPartialIdx(['de'], [], -1);
  const buchholzIdx = findExactOrPartialIdx(
    ['buchholz', 'bh', 'tb1', 'tb'],
    ['buchholz', 'tb1'],
    5
  );
  const sbIdx = findExactOrPartialIdx(['sb', 'sonnebornberger'], ['sb'], -1);
  const psIdx = findExactOrPartialIdx(['ps', 'progressive'], [], -1);
  const deltaIdx = findExactOrPartialIdx(
    ['perubahan', 'perubahanrating', 'ratingchange', 'delta', 'chg'],
    ['perubahan', 'ratingchange', 'delta', 'chg'],
    6
  );
  const idIdx = findExactOrPartialIdx(
    ['percasiid', 'idpercasi', 'fideid', 'id'],
    ['percasiid', 'idpercasi'],
    -1
  );

  const dataRows = hasHeaderRow
    ? nonEmptyRows.slice(headerRowIdx + 1)
    : nonEmptyRows;

  if (dataRows.length === 0) {
    return {
      standings: [],
      errors: ['Berkas Excel hanya berisi judul kolom tanpa data peringkat pemain.'],
    };
  }

  const standings: StandingEntry[] = [];
  const errors: string[] = [];

  dataRows.forEach((cols, idx) => {
    const rowNumber = headerRowIdx + idx + (hasHeaderRow ? 2 : 1);
    const name = nameIdx >= 0 ? String(cols[nameIdx] ?? '').trim() : '';
    if (!name) {
      errors.push(`Baris ${rowNumber}: Nama pemain wajib diisi.`);
      return;
    }

    const rawRank = rankIdx >= 0 ? String(cols[rankIdx] ?? '').trim() : '';
    const parsedRank = rawRank ? Number.parseInt(rawRank, 10) : standings.length + 1;

    const rawPointsCell = pointsIdx >= 0 ? cols[pointsIdx] : 0;
    const rawPointsStr = String(rawPointsCell ?? '').trim();
    const parsedPoints =
      pointsIdx >= 0 && rawPointsStr !== ''
        ? parseNumericScore(rawPointsCell)
        : 0;

    if (Number.isNaN(parsedPoints)) {
      errors.push(`Baris ${rowNumber}: Nilai poin "${rawPointsStr}" tidak valid.`);
      return;
    }

    const rawBhCell = buchholzIdx >= 0 ? cols[buchholzIdx] : 0;
    const rawBhStr = String(rawBhCell ?? '').trim();
    const parsedBuchholz =
      buchholzIdx >= 0 && rawBhStr !== '' ? parseNumericScore(rawBhCell) : 0;

    const rawDelta = deltaIdx >= 0 ? String(cols[deltaIdx] ?? '').trim() : '';
    const parsedDelta = rawDelta
      ? Number.parseInt(rawDelta.replace('+', ''), 10)
      : 0;

    const rawTitle = titleIdx >= 0 ? String(cols[titleIdx] ?? '').trim() : '';
    const club = clubIdx >= 0 ? String(cols[clubIdx] ?? '').trim() || 'Batam' : 'Batam';
    const percasiId =
      idIdx >= 0 ? String(cols[idIdx] ?? '').trim() || undefined : undefined;

    const entry: StandingEntry = {
      rank: Number.isNaN(parsedRank) ? standings.length + 1 : parsedRank,
      title: rawTitle || 'Non-Gelar',
      name,
      club,
      points: parsedPoints,
      buchholz: Number.isNaN(parsedBuchholz) ? 0 : parsedBuchholz,
      ratingChange: Number.isNaN(parsedDelta) ? 0 : parsedDelta,
      percasiId,
    };

    if (sNoIdx >= 0) {
      const parsedSNo = Number.parseInt(String(cols[sNoIdx] ?? '').trim(), 10);
      if (!Number.isNaN(parsedSNo)) entry.sNo = parsedSNo;
    }
    if (ratingIdx >= 0) {
      const rtgRaw = String(cols[ratingIdx] ?? '').trim();
      if (rtgRaw) {
        const numRtg = Number.parseInt(rtgRaw, 10);
        entry.rating = !Number.isNaN(numRtg) && /^\d+$/.test(rtgRaw) ? numRtg : rtgRaw;
      }
    }
    if (fedIdx >= 0) {
      const fed = String(cols[fedIdx] ?? '').trim();
      if (fed) entry.fed = fed;
    }
    if (categoryIdx >= 0) {
      const cat = String(cols[categoryIdx] ?? '').trim();
      if (cat) entry.category = cat;
    }
    if (rawPointsStr) {
      entry.pointsDisplay = rawPointsStr;
    }
    if (rawBhStr) {
      entry.bhDisplay = rawBhStr;
    }
    if (deIdx >= 0) {
      const parsedDe = Number.parseInt(String(cols[deIdx] ?? '').trim(), 10);
      if (!Number.isNaN(parsedDe)) entry.de = parsedDe;
    }
    if (sbIdx >= 0) {
      const sbRaw = String(cols[sbIdx] ?? '').trim();
      if (sbRaw) entry.sb = sbRaw;
    }
    if (psIdx >= 0) {
      const psRaw = String(cols[psIdx] ?? '').trim();
      if (psRaw) entry.ps = psRaw;
    }

    standings.push(entry);
  });

  standings.sort((a, b) => a.rank - b.rank);
  return { standings, errors };
}

export function parseStandingsExcelBuffer(
  data: ArrayBuffer | Uint8Array
): StandingsParseResult {
  try {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.byteLength === 0) {
      return {
        standings: [],
        errors: ['Berkas Excel kosong atau berukuran 0 byte.'],
      };
    }

    const workbook = XLSX.read(bytes, { type: 'array' });
    if (workbook.SheetNames.length === 0) {
      return {
        standings: [],
        errors: ['Berkas Excel tidak memiliki lembar kerja (worksheet).'],
      };
    }

    const preferredSheetName =
      workbook.SheetNames.find((name) =>
        /klasemen|standings|ranking|peringkat|hasil/i.test(name)
      ) ?? workbook.SheetNames[0];

    const worksheet = workbook.Sheets[preferredSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: true,
      defval: '',
    });

    return parseStandingsMatrix(rows);
  } catch {
    return {
      standings: [],
      errors: [
        'Berkas Excel (.xls / .xlsx) tidak dapat dibaca. Pastikan format file tidak rusak atau terproteksi kata sandi.',
      ],
    };
  }
}

export function generateSampleExcelBytes(): Uint8Array {
  const aoa = [
    ['Peringkat', 'Gelar', 'Nama', 'Klub', 'Poin', 'Buchholz', 'PerubahanRating'],
    [1, 'NM', 'Godfrid Harry Mollyson Siregar', 'Semanggi Chess Club', 6.5, 31.5, 14],
    [2, 'NM', 'Nurdin Simanjuntak', '-', 6.0, 30.0, 10],
    [3, 'NM', 'Sahat Sitanggang', '-', 5.5, 29.5, 8],
    [4, 'MP', 'Suhandri', '-', 5.0, 28.0, 5],
    [5, 'Non-Gelar', 'Hadi Hartoni Sembiring', '-', 4.5, 27.5, 6],
    [6, 'Non-Gelar', 'Jon Toni', 'Semanggi Chess Club', 4.0, 25.0, 4],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Klasemen');
  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Uint8Array(out);
}

export interface PairingsParseResult {
  pairings: RoundPairing[];
  detectedRounds: number[];
  errors: string[];
}

function normalizePairingResult(raw: unknown): string {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed || trimmed === '*') return '*';
  const compact = trimmed.replace(/\s+/g, '').toUpperCase();
  if (compact === '1-0') return '1 - 0';
  if (compact === '0-1') return '0 - 1';
  if (
    compact === '½-½' ||
    compact === '1/2-1/2' ||
    compact === '0.5-0.5' ||
    compact === '0,5-0,5'
  ) {
    return '½ - ½';
  }
  if (compact === '1F-0F') return '1F - 0F';
  if (compact === '0F-1F') return '0F - 1F';
  if (compact === '0F-0F') return '0F - 0F';
  return trimmed;
}

function parseOptionalInt(raw: unknown): number | undefined {
  const s = String(raw ?? '').trim();
  if (!s) return undefined;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalDisplayScore(raw: unknown): string | undefined {
  const s = String(raw ?? '').trim();
  return s ? s : undefined;
}

function extractRoundFromSheetName(sheetName: string): number | undefined {
  const match = sheetName.match(/(?:babak|round|rnd|rd)\s*[-_:]?\s*(\d+)/i);
  if (match) {
    const n = Number.parseInt(match[1], 10);
    if (Number.isFinite(n) && n >= 1) return n;
  }
  if (/^\d+$/.test(sheetName.trim())) {
    const n = Number.parseInt(sheetName.trim(), 10);
    if (Number.isFinite(n) && n >= 1) return n;
  }
  return undefined;
}

export function parsePairingsMatrix(
  rows: unknown[][],
  defaultRound = 1,
  overrideRound?: number
): PairingsParseResult {
  const nonEmptyRows = rows.filter((row) =>
    row.some((cell) => String(cell ?? '').trim() !== '')
  );

  if (nonEmptyRows.length === 0) {
    return {
      pairings: [],
      detectedRounds: [],
      errors: ['Berkas Excel pairing kosong atau tidak memiliki baris data.'],
    };
  }

  let headerRowIdx = nonEmptyRows.findIndex((row) => {
    const tokens = row.map(normalizeHeaderToken);
    const hasWhite = tokens.some((t) =>
      ['putih', 'white', 'namaputih', 'whitename', 'buahputih'].includes(t)
    );
    const hasBlack = tokens.some((t) =>
      ['hitam', 'black', 'namahitam', 'blackname', 'buahhitam'].includes(t)
    );
    return hasWhite && hasBlack;
  });

  const hasHeaderRow = headerRowIdx >= 0;
  if (headerRowIdx < 0) {
    headerRowIdx = 0;
  }

  const headers = nonEmptyRows[headerRowIdx].map(normalizeHeaderToken);

  let roundIdx = -1;
  let boardIdx = -1;
  let whiteSeedIdx = -1;
  let whiteTitleIdx = -1;
  let whiteNameIdx = -1;
  let whitePointsIdx = -1;
  let resultIdx = -1;
  let blackPointsIdx = -1;
  let blackNameIdx = -1;
  let blackTitleIdx = -1;
  let blackSeedIdx = -1;

  if (hasHeaderRow) {
    roundIdx = headers.findIndex((h) =>
      ['babak', 'round', 'rnd', 'rd'].includes(h)
    );
    boardIdx = headers.findIndex((h) =>
      ['bo', 'board', 'meja', 'no'].includes(h)
    );
    whiteNameIdx = headers.findIndex((h) =>
      ['putih', 'white', 'namaputih', 'whitename', 'buahputih'].includes(h)
    );
    blackNameIdx = headers.findIndex((h) =>
      ['hitam', 'black', 'namahitam', 'blackname', 'buahhitam'].includes(h)
    );
    resultIdx = headers.findIndex((h) =>
      ['res', 'result', 'hasil', 'skor', 'score'].includes(h)
    );
    whiteTitleIdx = headers.findIndex((h) =>
      ['gelarputih', 'whitetitle', 'titputih'].includes(h)
    );
    blackTitleIdx = headers.findIndex((h) =>
      ['gelarhitam', 'blacktitle', 'tithitam'].includes(h)
    );

    const explicitWhiteSeedIdx = headers.findIndex((h) =>
      ['snoputih', 'whiteseed', 'whitesno', 'noputih'].includes(h)
    );
    const explicitBlackSeedIdx = headers.findIndex((h) =>
      ['snohitam', 'blackseed', 'blacksno', 'nohitam'].includes(h)
    );
    const explicitWhitePtsIdx = headers.findIndex((h) =>
      ['poinputih', 'ptsputih', 'whitepts', 'whitepoints'].includes(h)
    );
    const explicitBlackPtsIdx = headers.findIndex((h) =>
      ['poinhitam', 'ptshitam', 'blackpts', 'blackpoints'].includes(h)
    );

    const snoIndices = headers
      .map((h, i) => (['sno', 'seed', 'startno'].includes(h) ? i : -1))
      .filter((i) => i >= 0);

    whiteSeedIdx =
      explicitWhiteSeedIdx >= 0
        ? explicitWhiteSeedIdx
        : snoIndices.find((i) => i < whiteNameIdx) ?? -1;
    blackSeedIdx =
      explicitBlackSeedIdx >= 0
        ? explicitBlackSeedIdx
        : snoIndices.find((i) => i > blackNameIdx) ?? -1;

    const ptsIndices = headers
      .map((h, i) => (['pts', 'poin', 'points'].includes(h) ? i : -1))
      .filter((i) => i >= 0);

    const splitBoundary = resultIdx >= 0 ? resultIdx : blackNameIdx;
    whitePointsIdx =
      explicitWhitePtsIdx >= 0
        ? explicitWhitePtsIdx
        : ptsIndices.find((i) => i < splitBoundary) ?? -1;
    blackPointsIdx =
      explicitBlackPtsIdx >= 0
        ? explicitBlackPtsIdx
        : ptsIndices.find((i) => i > resultIdx && i <= blackNameIdx) ??
          ptsIndices.find((i) => i > whiteNameIdx && i !== whitePointsIdx) ??
          -1;
  } else {
    const sampleRow = nonEmptyRows[0] ?? [];
    if (sampleRow.length >= 8) {
      boardIdx = 0;
      whiteSeedIdx = 1;
      whiteNameIdx = 2;
      whitePointsIdx = 3;
      resultIdx = 4;
      blackPointsIdx = 5;
      blackNameIdx = 6;
      blackSeedIdx = 7;
    } else if (sampleRow.length >= 5) {
      roundIdx = 0;
      boardIdx = 1;
      whiteNameIdx = 2;
      resultIdx = 3;
      blackNameIdx = 4;
    } else {
      boardIdx = 0;
      whiteNameIdx = 1;
      resultIdx = 2;
      blackNameIdx = 3;
    }
  }

  const dataRows = hasHeaderRow
    ? nonEmptyRows.slice(headerRowIdx + 1)
    : nonEmptyRows;

  if (dataRows.length === 0) {
    return {
      pairings: [],
      detectedRounds: [],
      errors: ['Berkas pairing hanya berisi judul kolom tanpa data pertandingan.'],
    };
  }

  const pairings: RoundPairing[] = [];
  const errors: string[] = [];
  const boardCounters = new Map<number, number>();

  dataRows.forEach((cols, idx) => {
    const rowNumber = headerRowIdx + idx + (hasHeaderRow ? 2 : 1);
    const whiteName =
      whiteNameIdx >= 0 ? String(cols[whiteNameIdx] ?? '').trim() : '';
    const blackName =
      blackNameIdx >= 0 ? String(cols[blackNameIdx] ?? '').trim() : '';

    if (!whiteName && !blackName) {
      return;
    }

    const firstCellLower = String(cols[0] ?? '').trim().toLowerCase();
    if (
      (firstCellLower.startsWith('chess-results') ||
        firstCellLower.startsWith('program') ||
        firstCellLower.startsWith('notes')) &&
      !blackName
    ) {
      return;
    }

    if (!whiteName || !blackName) {
      errors.push(
        `Baris ${rowNumber}: Nama pemain Putih dan Hitam wajib diisi (gunakan "BYE" jika bye).`
      );
      return;
    }

    const parsedRound =
      overrideRound !== undefined
        ? overrideRound
        : roundIdx >= 0
          ? parseOptionalInt(cols[roundIdx]) ?? defaultRound
          : defaultRound;
    const round = parsedRound >= 1 ? parsedRound : defaultRound;

    const nextBoard = (boardCounters.get(round) ?? 0) + 1;
    const parsedBoard = boardIdx >= 0 ? parseOptionalInt(cols[boardIdx]) : undefined;
    const board = parsedBoard && parsedBoard >= 1 ? parsedBoard : nextBoard;
    boardCounters.set(round, Math.max(nextBoard, board));

    const entry: RoundPairing = {
      round,
      board,
      whiteName,
      blackName,
      result:
        resultIdx >= 0 ? normalizePairingResult(cols[resultIdx]) : '*',
    };

    const whiteSeed =
      whiteSeedIdx >= 0 ? parseOptionalInt(cols[whiteSeedIdx]) : undefined;
    const blackSeed =
      blackSeedIdx >= 0 ? parseOptionalInt(cols[blackSeedIdx]) : undefined;
    const whitePoints =
      whitePointsIdx >= 0
        ? parseOptionalDisplayScore(cols[whitePointsIdx])
        : undefined;
    const blackPoints =
      blackPointsIdx >= 0
        ? parseOptionalDisplayScore(cols[blackPointsIdx])
        : undefined;
    const whiteTitle =
      whiteTitleIdx >= 0 ? String(cols[whiteTitleIdx] ?? '').trim() : '';
    const blackTitle =
      blackTitleIdx >= 0 ? String(cols[blackTitleIdx] ?? '').trim() : '';

    if (whiteSeed !== undefined) entry.whiteSeed = whiteSeed;
    if (blackSeed !== undefined) entry.blackSeed = blackSeed;
    if (whitePoints !== undefined) entry.whitePoints = whitePoints;
    if (blackPoints !== undefined) entry.blackPoints = blackPoints;
    if (whiteTitle) entry.whiteTitle = whiteTitle;
    if (blackTitle) entry.blackTitle = blackTitle;

    pairings.push(entry);
  });

  if (pairings.length === 0 && errors.length === 0) {
    errors.push('Tidak ditemukan baris pairing pertandingan yang valid.');
  }

  pairings.sort((a, b) => (a.round !== b.round ? a.round - b.round : a.board - b.board));
  const detectedRounds = Array.from(new Set(pairings.map((p) => p.round))).sort(
    (a, b) => a - b
  );

  return { pairings, detectedRounds, errors };
}

export function parsePairingsCsv(
  csvText: string,
  targetRound?: number
): PairingsParseResult {
  const rawLines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return {
      pairings: [],
      detectedRounds: [],
      errors: ['Berkas CSV pairing kosong atau tidak memiliki baris data.'],
    };
  }

  const headerLine = rawLines[0];
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semiCount = (headerLine.match(/;/g) ?? []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';
  const matrix = rawLines.map((line) => splitDelimitedLine(line, delimiter));
  return parsePairingsMatrix(matrix, targetRound ?? 1, targetRound);
}

export function parsePairingsExcelBuffer(
  data: ArrayBuffer | Uint8Array,
  targetRound?: number
): PairingsParseResult {
  try {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.byteLength === 0) {
      return {
        pairings: [],
        detectedRounds: [],
        errors: ['Berkas Excel pairing kosong atau berukuran 0 byte.'],
      };
    }

    const workbook = XLSX.read(bytes, { type: 'array' });
    if (workbook.SheetNames.length === 0) {
      return {
        pairings: [],
        detectedRounds: [],
        errors: ['Berkas Excel tidak memiliki lembar kerja (worksheet).'],
      };
    }

    if (targetRound !== undefined) {
      const matchingSheet =
        workbook.SheetNames.find(
          (name) => extractRoundFromSheetName(name) === targetRound
        ) ??
        workbook.SheetNames.find((name) =>
          /pairing|babak|round|pertandingan/i.test(name)
        ) ??
        workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[matchingSheet],
        { header: 1, raw: true, defval: '' }
      );
      return parsePairingsMatrix(rows, targetRound, targetRound);
    }

    const roundNamedSheets = workbook.SheetNames.filter(
      (name) => extractRoundFromSheetName(name) !== undefined
    );

    if (roundNamedSheets.length > 1) {
      const allPairings: RoundPairing[] = [];
      const allErrors: string[] = [];
      roundNamedSheets.forEach((sheetName) => {
        const sheetRound = extractRoundFromSheetName(sheetName) ?? 1;
        const rows = XLSX.utils.sheet_to_json<unknown[]>(
          workbook.Sheets[sheetName],
          { header: 1, raw: true, defval: '' }
        );
        const res = parsePairingsMatrix(rows, sheetRound);
        allPairings.push(...res.pairings);
        res.errors.forEach((err) => allErrors.push(`[${sheetName}] ${err}`));
      });
      allPairings.sort((a, b) =>
        a.round !== b.round ? a.round - b.round : a.board - b.board
      );
      return {
        pairings: allPairings,
        detectedRounds: Array.from(new Set(allPairings.map((p) => p.round))).sort(
          (a, b) => a - b
        ),
        errors: allErrors,
      };
    }

    const preferredSheetName =
      workbook.SheetNames.find((name) =>
        /pairing|babak|round|pertandingan/i.test(name)
      ) ?? workbook.SheetNames[0];
    const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(
      workbook.Sheets[preferredSheetName],
      { header: 1, raw: true, defval: '' }
    );
    const inferredRound = extractRoundFromSheetName(preferredSheetName) ?? 1;
    return parsePairingsMatrix(sheetRows, inferredRound);
  } catch {
    return {
      pairings: [],
      detectedRounds: [],
      errors: [
        'Berkas Excel pairing (.xls / .xlsx) tidak dapat dibaca. Pastikan format file valid.',
      ],
    };
  }
}

export function mergeRoundPairings(
  existingPairings: RoundPairing[],
  incomingPairings: RoundPairing[],
  roundsToReplace?: number[]
): RoundPairing[] {
  const replaceSet = new Set(
    roundsToReplace && roundsToReplace.length > 0
      ? roundsToReplace
      : incomingPairings.map((p) => p.round)
  );
  const kept = existingPairings.filter((p) => !replaceSet.has(p.round));
  return [...kept, ...incomingPairings].sort((a, b) =>
    a.round !== b.round ? a.round - b.round : a.board - b.board
  );
}

export function generateSamplePairingsExcelBytes(roundNumber = 1): Uint8Array {
  const aoa = [
    [
      'Babak',
      'Meja',
      'S.No. Putih',
      'Putih',
      'Poin Putih',
      'Hasil',
      'Poin Hitam',
      'Hitam',
      'S.No. Hitam',
    ],
    [
      roundNumber,
      1,
      1,
      'Godfrid Harry Mollyson Siregar, NM',
      '0',
      '1 - 0',
      '0',
      'Sahat Sitanggang, NM',
      2,
    ],
    [
      roundNumber,
      2,
      3,
      'Nurdin Simanjuntak, NM',
      '0',
      '½ - ½',
      '0',
      'Suhandri, PM',
      4,
    ],
    [
      roundNumber,
      3,
      5,
      'Jonathan Charmian Vivaldy',
      '0',
      '*',
      '0',
      'Jon Toni',
      6,
    ],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Babak ${roundNumber}`);
  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Uint8Array(out);
}

export interface InitialRankingsParseResult {
  entries: InitialRankEntry[];
  usesDualRating: boolean;
  errors: string[];
}

function parseInitialRankCellRating(raw: unknown): number | '-' {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : '-';
  }
  const str = String(raw ?? '').trim();
  if (!str || str === '-' || str === '0') return '-';
  const num = Number.parseInt(str.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(num) && num > 0 ? num : '-';
}

function normalizeInitialRankGender(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return 'Putra';
  const lower = s.toLowerCase();
  if (['p', 'putri', 'f', 'female', 'w', 'woman', 'wanita', 'perempuan'].includes(lower)) {
    return 'Putri';
  }
  if (['l', 'putra', 'm', 'male', 'pria', 'laki-laki', 'lakilaki'].includes(lower)) {
    return 'Putra';
  }
  if (s === '-') return '-';
  return s;
}

export function parseInitialRankingsMatrix(
  rows: unknown[][]
): InitialRankingsParseResult {
  const nonEmptyRows = rows.filter((row) =>
    row.some((cell) => String(cell ?? '').trim() !== '')
  );

  if (nonEmptyRows.length === 0) {
    return {
      entries: [],
      usesDualRating: false,
      errors: ['Berkas Excel/CSV peringkat awal kosong atau tidak memiliki baris data.'],
    };
  }

  let headerRowIdx = nonEmptyRows.findIndex((row) => {
    const tokens = row.map(normalizeHeaderToken);
    const hasNameCol = tokens.some((t) =>
      ['nama', 'name', 'pemain', 'player', 'namapemain'].includes(t)
    );
    const hasSeedOrMetricCol = tokens.some((t) =>
      [
        'sno',
        'noawal',
        'seed',
        'startno',
        'no',
        'rating',
        'rtg',
        'nrtg',
        'irtg',
        'gender',
        'fed',
        'clubcity',
        'club',
        'klub',
        'gelar',
        'title',
      ].includes(t)
    );
    return hasNameCol && hasSeedOrMetricCol;
  });

  const hasHeaderRow = headerRowIdx >= 0;
  if (headerRowIdx < 0) {
    headerRowIdx = 0;
  }

  const headers = nonEmptyRows[headerRowIdx].map(normalizeHeaderToken);

  const findExactOrPartialIdx = (
    exactList: string[],
    partialList: string[],
    fallback: number
  ): number => {
    if (!hasHeaderRow) return fallback;
    const exactIdx = headers.findIndex((h) => exactList.includes(h));
    if (exactIdx >= 0) return exactIdx;
    const partialIdx = headers.findIndex((h) =>
      partialList.some((p) => h.includes(p))
    );
    return partialIdx >= 0 ? partialIdx : -1;
  };

  const sNoIdx = findExactOrPartialIdx(
    ['sno', 'noawal', 'seed', 'startno', 'no'],
    ['sno', 'noawal', 'seed'],
    0
  );
  const titleIdx = findExactOrPartialIdx(['gelar', 'title', 'tit'], ['gelar', 'title'], -1);
  const nameIdx = findExactOrPartialIdx(
    ['nama', 'name', 'pemain', 'player', 'namapemain'],
    ['nama', 'name', 'pemain', 'player'],
    1
  );
  const genderIdx = findExactOrPartialIdx(
    ['gender', 'jeniskelamin', 'jk', 'kelamin', 'sex', 'putraputri'],
    ['gender', 'kelamin'],
    -1
  );
  const natRatingIdx = findExactOrPartialIdx(
    ['nrtg', 'nationalrating', 'ratingnasional', 'rtgnas'],
    ['nrtg', 'nationalrating', 'ratingnasional'],
    -1
  );
  const intlRatingIdx = findExactOrPartialIdx(
    ['irtg', 'internationalrating', 'ratinginternasional', 'fidertg', 'fiderating'],
    ['irtg', 'internationalrating', 'ratinginternasional'],
    -1
  );
  const ratingIdx = findExactOrPartialIdx(
    ['rating', 'rtg', 'elo'],
    ['rating', 'rtg'],
    hasHeaderRow ? -1 : 3
  );
  const fedIdx = findExactOrPartialIdx(['fed', 'federasi', 'negara'], ['fed'], -1);
  const clubIdx = findExactOrPartialIdx(
    ['clubcity', 'klubkota', 'club', 'klub', 'city', 'kota', 'kecamatan', 'asal'],
    ['clubcity', 'club', 'klub', 'city', 'kota', 'kecamatan'],
    hasHeaderRow ? -1 : 5
  );
  const categoryIdx = findExactOrPartialIdx(
    ['category', 'kategori', 'kat'],
    ['category', 'kategori'],
    -1
  );

  const usesDualRating = natRatingIdx >= 0 || intlRatingIdx >= 0;

  const dataRows = hasHeaderRow
    ? nonEmptyRows.slice(headerRowIdx + 1)
    : nonEmptyRows;

  if (dataRows.length === 0) {
    return {
      entries: [],
      usesDualRating,
      errors: ['Berkas hanya berisi judul kolom tanpa daftar pemain peringkat awal.'],
    };
  }

  const entries: InitialRankEntry[] = [];
  const errors: string[] = [];

  dataRows.forEach((cols, idx) => {
    const rowNumber = headerRowIdx + idx + (hasHeaderRow ? 2 : 1);
    const rawName = nameIdx >= 0 ? String(cols[nameIdx] ?? '').trim() : '';

    if (!rawName) {
      const firstCellLower = String(cols[0] ?? '').trim().toLowerCase();
      if (
        !firstCellLower ||
        firstCellLower.startsWith('chess-results') ||
        firstCellLower.startsWith('program') ||
        firstCellLower.startsWith('notes')
      ) {
        return;
      }
      errors.push(`Baris ${rowNumber}: Nama pemain wajib diisi.`);
      return;
    }

    const firstCellLower = String(cols[0] ?? '').trim().toLowerCase();
    if (
      firstCellLower.startsWith('chess-results') ||
      firstCellLower.startsWith('program')
    ) {
      return;
    }

    const parsedSNo =
      sNoIdx >= 0 ? parseOptionalInt(cols[sNoIdx]) : undefined;
    const sNo = parsedSNo && parsedSNo >= 1 ? parsedSNo : entries.length + 1;
    const rawTitle = titleIdx >= 0 ? String(cols[titleIdx] ?? '').trim() : undefined;
    const resolvedTitle = resolvePlayerMasterTitle(rawName, [], rawTitle);
    const cleanName = stripTitleSuffix(rawName) || rawName;
    const gender =
      genderIdx >= 0 ? normalizeInitialRankGender(cols[genderIdx]) : 'Putra';
    const fed =
      fedIdx >= 0
        ? String(cols[fedIdx] ?? '').trim().toUpperCase() || 'INA'
        : 'INA';
    const clubCity =
      clubIdx >= 0 ? String(cols[clubIdx] ?? '').trim() || '-' : '-';
    const category =
      categoryIdx >= 0 ? String(cols[categoryIdx] ?? '').trim() || undefined : undefined;

    const entry: InitialRankEntry = {
      sNo,
      name: cleanName,
      gender,
      fed,
      clubCity,
      ...(resolvedTitle ? { title: resolvedTitle } : {}),
      ...(category ? { category } : {}),
    };

    if (usesDualRating) {
      entry.nationalRating =
        natRatingIdx >= 0
          ? parseInitialRankCellRating(cols[natRatingIdx])
          : ratingIdx >= 0
            ? parseInitialRankCellRating(cols[ratingIdx])
            : '-';
      entry.internationalRating =
        intlRatingIdx >= 0
          ? parseInitialRankCellRating(cols[intlRatingIdx])
          : '-';
    } else {
      entry.rating =
        ratingIdx >= 0 ? parseInitialRankCellRating(cols[ratingIdx]) : '-';
    }

    entries.push(entry);
  });

  if (entries.length === 0 && errors.length === 0) {
    errors.push('Tidak ditemukan data pemain yang valid dalam berkas peringkat awal.');
  }

  entries.sort((a, b) => a.sNo - b.sNo);
  return { entries, usesDualRating, errors };
}

export function parseInitialRankingsCsv(
  csvText: string
): InitialRankingsParseResult {
  const rawLines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return {
      entries: [],
      usesDualRating: false,
      errors: ['Berkas CSV peringkat awal kosong atau tidak memiliki baris data.'],
    };
  }

  const headerLine = rawLines[0];
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semiCount = (headerLine.match(/;/g) ?? []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';
  const matrix = rawLines.map((line) => splitDelimitedLine(line, delimiter));
  return parseInitialRankingsMatrix(matrix);
}

export function parseInitialRankingsExcelBuffer(
  data: ArrayBuffer | Uint8Array
): InitialRankingsParseResult {
  try {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.byteLength === 0) {
      return {
        entries: [],
        usesDualRating: false,
        errors: ['Berkas Excel peringkat awal kosong atau berukuran 0 byte.'],
      };
    }

    const workbook = XLSX.read(bytes, { type: 'array' });
    if (workbook.SheetNames.length === 0) {
      return {
        entries: [],
        usesDualRating: false,
        errors: ['Berkas Excel tidak memiliki lembar kerja (worksheet).'],
      };
    }

    const preferredSheetName =
      workbook.SheetNames.find((name) =>
        /peringkat|initial|starting|peserta|seed|player/i.test(name)
      ) ?? workbook.SheetNames[0];

    const worksheet = workbook.Sheets[preferredSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: true,
      defval: '',
    });

    return parseInitialRankingsMatrix(rows);
  } catch {
    return {
      entries: [],
      usesDualRating: false,
      errors: [
        'Berkas Excel (.xls / .xlsx) tidak dapat dibaca. Pastikan format file valid.',
      ],
    };
  }
}

export function generateSampleInitialRankingsExcelBytes(
  useDualRating = false
): Uint8Array {
  const aoa = useDualRating
    ? [
        ['S. No.', 'Gelar', 'Name', 'Gender', 'N. Rtg', 'I. Rtg', 'FED', 'Club/City'],
        [1, 'NM', 'Godfrid Harry Mollyson Siregar', 'Putra', 2243, '-', 'INA', 'Sagulung'],
        [2, 'MP', 'Suhandri', 'Putra', 1992, '-', 'INA', 'KOCAK'],
        [3, '', 'Jonathan Charmian Vivaldy', 'Putra', 1896, 1875, 'INA', 'Semanggi'],
        [4, '', 'Wahyu Rizky Pratama', 'Putra', '-', '-', 'INA', 'Bengkong'],
      ]
    : [
        ['S. No.', 'Gelar', 'Name', 'Gender', 'Rating', 'FED', 'Club/City'],
        [1, 'NM', 'Godfrid Harry Mollyson Siregar', 'Putra', 2243, 'INA', 'Sagulung'],
        [2, 'MP', 'Suhandri', 'Putra', 1992, 'INA', 'KOCAK'],
        [3, '', 'Jonathan Charmian Vivaldy', 'Putra', 1896, 'INA', 'Semanggi'],
        [4, '', 'Wahyu Rizky Pratama', 'Putra', '-', 'INA', 'Bengkong'],
      ];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Peringkat Awal');
  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Uint8Array(out);
}

export interface BackupValidationResult {
  valid: boolean;
  data?: PortalData;
  error?: string;
}

export function validatePortalBackup(jsonText: string): BackupValidationResult {
  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: 'Berkas backup harus berupa objek JSON yang valid.' };
    }
    const candidate = parsed as Partial<PortalData>;
    if (
      !Array.isArray(candidate.athletes) ||
      !Array.isArray(candidate.tournaments) ||
      !Array.isArray(candidate.news)
    ) {
      return {
        valid: false,
        error: 'Struktur backup tidak lengkap: wajib memiliki daftar athletes, tournaments, dan news.',
      };
    }
    return {
      valid: true,
      data: {
        version: typeof candidate.version === 'string' ? candidate.version : '1.0',
        updatedAt:
          typeof candidate.updatedAt === 'string'
            ? candidate.updatedAt
            : new Date().toISOString(),
        athletes: candidate.athletes,
        tournaments: candidate.tournaments,
        news: candidate.news,
      },
    };
  } catch {
    return { valid: false, error: 'Berkas JSON rusak atau format tidak valid.' };
  }
}

export type MatchOutcome = 'Menang' | 'Remis' | 'Kalah' | 'Berlangsung';

export interface ColorWdlStats {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  winRate: number;
  scoreRate: number;
}

export interface AthleteMatchRecord {
  tournamentId: string;
  tournamentName: string;
  tournamentStatus: Tournament['status'];
  timeControlCategory: Tournament['timeControlCategory'];
  round: number;
  board: number;
  color: 'Putih' | 'Hitam';
  playerNameInMatch: string;
  playerPoints?: number | string;
  opponentName: string;
  opponentSeed?: number;
  opponentPoints?: number | string;
  result: string;
  outcome: MatchOutcome;
  isForfeit: boolean;
}

export interface AthleteTournamentStandingSummary {
  tournamentId: string;
  tournamentName: string;
  date: string;
  timeControlCategory: Tournament['timeControlCategory'];
  rank: number;
  totalParticipants: number;
  pointsDisplay: string;
  bhDisplay?: string;
  sb?: number | string;
  ps?: number | string;
  ratingChange: number;
}

export interface AthleteDetailProfile {
  key: string;
  fullName: string;
  title: string;
  coachTitle?: string;
  arbiterTitle?: string;
  fed?: string;
  category: string;
  club: string;
  city?: string;
  district?: string;
  birthDate?: string;
  birthYear?: number;
  age?: number | null;
  photoUrl?: string;
  federationStatus?: string;
  bio: string;
  ratings?: Athlete['ratings'];
  tournamentRating?: number | string;
  seedNumber?: number;
  registeredAthlete?: Athlete;
  totalStats: ColorWdlStats;
  whiteStats: ColorWdlStats;
  blackStats: ColorWdlStats;
  ongoingGames: number;
  matches: AthleteMatchRecord[];
  standingsRecords: AthleteTournamentStandingSummary[];
}

const ATHLETE_NAME_ALIASES: Record<string, string> = {
  'isma yudi': 'ismail yudi',
  'bharata dharma surya': 'bharata surya dharma',
  'yan fitra': 'yan vitra',
};

export const MASTER_PLAYER_TITLE_CODES = new Set([
  'GM',
  'IM',
  'FM',
  'WFM',
  'WIM',
  'WGM',
  'NM',
  'MP',
  'PM',
  'AGM',
  'AIM',
  'AFM',
  'ACM',
]);

export function normalizeAthleteName(name: string): string {
  const withoutTitle = name
    .trim()
    .replace(
      /,\s*(GM|IM|FM|WFM|WIM|WGM|NM|MP|PM|WNM|WN|PNP|FA|AGM|AIM|AFM|ACM)$/i,
      ''
    )
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return ATHLETE_NAME_ALIASES[withoutTitle] ?? withoutTitle;
}

export function stripTitleSuffix(name: string): string {
  return name
    .trim()
    .replace(
      /,\s*(GM|IM|FM|WFM|WIM|WGM|NM|MP|PM|WNM|WN|PNP|FA|AGM|AIM|AFM|ACM)$/i,
      ''
    )
    .trim();
}

function extractTitleSuffix(name: string): string | undefined {
  const match = name
    .trim()
    .match(/,\s*(GM|IM|FM|WFM|WIM|WGM|NM|MP|PM|WNM|WN|PNP|FA|AGM|AIM|AFM|ACM)$/i);
  if (!match) return undefined;
  const code = match[1].toUpperCase();
  return code === 'PM' ? 'MP' : code;
}

function normalizeMasterTitleCode(rawTitle?: string): string | undefined {
  if (!rawTitle) return undefined;
  const upper = rawTitle.trim().toUpperCase();
  if (!MASTER_PLAYER_TITLE_CODES.has(upper)) return undefined;
  return upper === 'PM' ? 'MP' : upper;
}

export function resolvePlayerMasterTitle(
  rawName: string,
  athletes: Athlete[],
  explicitTitle?: string
): string | undefined {
  const suffixTitle = extractTitleSuffix(rawName);
  if (suffixTitle && MASTER_PLAYER_TITLE_CODES.has(suffixTitle)) {
    return suffixTitle;
  }
  const normalizedExplicit = normalizeMasterTitleCode(explicitTitle);
  if (normalizedExplicit) {
    return normalizedExplicit;
  }
  const key = normalizeAthleteName(rawName);
  if (!key) return undefined;
  const matched = athletes.find((a) => normalizeAthleteName(a.fullName) === key);
  return matched ? normalizeMasterTitleCode(matched.title) : undefined;
}

export function getPlayerDisplayParts(
  rawName: string,
  athletes: Athlete[],
  explicitTitle?: string
): { displayName: string; masterTitle?: string } {
  const trimmed = rawName.trim();
  if (!trimmed) return { displayName: '' };
  if (trimmed.toUpperCase() === 'BYE') return { displayName: 'BYE' };
  const masterTitle = resolvePlayerMasterTitle(trimmed, athletes, explicitTitle);
  const displayName = stripTitleSuffix(trimmed);
  return {
    displayName: displayName || trimmed,
    masterTitle,
  };
}

export function formatPlayerNameWithMasterTitle(
  rawName: string,
  athletes: Athlete[],
  explicitTitle?: string
): string {
  const trimmed = rawName.trim();
  if (!trimmed) return '';
  if (trimmed.toUpperCase() === 'BYE') return trimmed;

  const existingSuffix = extractTitleSuffix(trimmed);
  if (existingSuffix && MASTER_PLAYER_TITLE_CODES.has(existingSuffix)) {
    return trimmed;
  }

  const resolvedTitle = resolvePlayerMasterTitle(trimmed, athletes, explicitTitle);
  if (!resolvedTitle) {
    return trimmed;
  }
  return `${trimmed}, ${resolvedTitle}`;
}

export function syncAthletesFromTournaments(
  athletes: Athlete[],
  tournaments: Tournament[]
): Athlete[] {
  const seenKeys = new Set<string>(
    athletes.map((a) => normalizeAthleteName(a.fullName)).filter(Boolean)
  );
  const usedIds = new Set<string>(athletes.map((a) => a.id));
  const additions: Athlete[] = [];

  const nextUniqueId = (baseSlug: string): string => {
    let candidate = baseSlug;
    let counter = 2;
    while (usedIds.has(candidate)) {
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
    usedIds.add(candidate);
    return candidate;
  };

  const toTitleCode = (rawName: string, explicitTitle?: string): TitleCode => {
    const master = resolvePlayerMasterTitle(rawName, [], explicitTitle);
    if (master && TITLE_OPTIONS.includes(master as TitleCode)) {
      return master as TitleCode;
    }
    return 'Non-Gelar';
  };

  tournaments.forEach((tournament, tIdx) => {
    const trnTag = (tournament.id || `t${tIdx + 1}`)
      .replace(/^trn-/, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
      .slice(0, 14);

    const registerCandidate = (params: {
      rawName: string;
      explicitTitle?: string;
      genderRaw?: string;
      categoryRaw?: string;
      clubCityRaw?: string;
      ratingVal?: number | string;
      seqHint: string;
    }) => {
      const cleanDisplayName = stripTitleSuffix(params.rawName);
      const key = normalizeAthleteName(cleanDisplayName);
      if (!key || key === 'bye') return;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const { city, district, club } = mapClubCityToAthleteLocation(
        params.clubCityRaw
      );
      const genderLower = (params.genderRaw ?? '').trim().toLowerCase();
      const catLower = (params.categoryRaw ?? '').trim().toLowerCase();
      const clubCityLower = (params.clubCityRaw ?? '').trim().toLowerCase();
      const isPutri = genderLower === 'putri' || catLower === 'putri' || catLower.includes('putri');
      const isJunior = catLower.includes('junior') || clubCityLower === 'junior';

      const category: AthleteCategory = isPutri
        ? 'Senior Putri'
        : isJunior
          ? 'Junior U-18'
          : 'Senior Putra';
      const numericRating = parseInitialRankNumericRating(params.ratingVal);

      additions.push({
        id: nextUniqueId(`ath-${trnTag}-${params.seqHint}`),
        fullName: cleanDisplayName,
        title: toTitleCode(params.rawName, params.explicitTitle),
        category,
        gender: isPutri ? 'Putri' : 'Putra',
        club,
        city,
        district,
        ratings: {
          standard: numericRating,
          rapid: numericRating,
          blitz: numericRating,
        },
        bio:
          city === 'Kota Batam'
            ? `Atlet catur terdaftar Pengkot PERCASI Kota Batam (Peserta ${tournament.name}).`
            : `Atlet catur asal ${city} terdaftar Pengprov PERCASI Kepulauan Riau (Peserta ${tournament.name}).`,
        federationStatus: 'Atlet',
        tournamentHistory: [],
      });
    };

    (tournament.initialRankings ?? []).forEach((entry, idx) => {
      registerCandidate({
        rawName: entry.name,
        explicitTitle: entry.title,
        genderRaw: entry.gender,
        categoryRaw: entry.category,
        clubCityRaw: entry.clubCity ?? entry.club,
        ratingVal: entry.rating ?? entry.nationalRating,
        seqHint: `ir-${String(entry.sNo ?? idx + 1).padStart(3, '0')}`,
      });
    });

    (tournament.standings ?? []).forEach((entry, idx) => {
      registerCandidate({
        rawName: entry.name,
        explicitTitle: entry.title,
        categoryRaw: entry.category,
        clubCityRaw: entry.club,
        ratingVal: entry.rating,
        seqHint: `st-${String(entry.sNo ?? entry.rank ?? idx + 1).padStart(3, '0')}`,
      });
    });

    (tournament.pairings ?? []).forEach((pairing, idx) => {
      registerCandidate({
        rawName: pairing.whiteName,
        explicitTitle: pairing.whiteTitle,
        seqHint: `p${pairing.round}-${pairing.board}w-${idx + 1}`,
      });
      registerCandidate({
        rawName: pairing.blackName,
        explicitTitle: pairing.blackTitle,
        seqHint: `p${pairing.round}-${pairing.board}b-${idx + 1}`,
      });
    });
  });

  if (additions.length === 0) return athletes;
  return [...athletes, ...additions];
}

export function evaluatePairingOutcome(
  result: string,
  color: 'Putih' | 'Hitam'
): { outcome: MatchOutcome; isForfeit: boolean } {
  const normalized = result.replace(/\s+/g, '').toUpperCase();
  if (!normalized || normalized === '*') {
    return { outcome: 'Berlangsung', isForfeit: false };
  }
  const isForfeit = normalized.includes('F');

  if (normalized === '1-0' || normalized === '1F-0F') {
    return { outcome: color === 'Putih' ? 'Menang' : 'Kalah', isForfeit };
  }
  if (normalized === '0-1' || normalized === '0F-1F') {
    return { outcome: color === 'Hitam' ? 'Menang' : 'Kalah', isForfeit };
  }
  if (normalized === '0F-0F' || normalized === '0-0') {
    return { outcome: 'Kalah', isForfeit: true };
  }
  if (
    normalized === '½-½' ||
    normalized === '1/2-1/2' ||
    normalized === '0.5-0.5' ||
    normalized === '0,5-0,5'
  ) {
    return { outcome: 'Remis', isForfeit };
  }

  return { outcome: 'Berlangsung', isForfeit };
}

function finalizeColorStats(
  wins: number,
  draws: number,
  losses: number
): ColorWdlStats {
  const games = wins + draws + losses;
  const points = wins + draws * 0.5;
  return {
    games,
    wins,
    draws,
    losses,
    points,
    winRate: games > 0 ? Math.round((wins / games) * 1000) / 10 : 0,
    scoreRate: games > 0 ? Math.round((points / games) * 1000) / 10 : 0,
  };
}

export function buildAthleteDetailProfile(
  identifier: string,
  athletes: Athlete[],
  tournaments: Tournament[]
): AthleteDetailProfile {
  const byId = athletes.find((a) => a.id === identifier);
  const identifierKey = normalizeAthleteName(identifier);
  const registeredAthlete =
    byId ??
    athletes.find((a) => normalizeAthleteName(a.fullName) === identifierKey);

  const targetKey = registeredAthlete
    ? normalizeAthleteName(registeredAthlete.fullName)
    : identifierKey;

  const standingsRecords: AthleteTournamentStandingSummary[] = [];
  let matchedStanding: StandingEntry | undefined;
  let matchedInitial: InitialRankEntry | undefined;
  let fallbackDisplayName = registeredAthlete?.fullName ?? stripTitleSuffix(identifier);
  let fallbackTitle = registeredAthlete?.title ?? extractTitleSuffix(identifier) ?? 'Non-Gelar';

  const matches: AthleteMatchRecord[] = [];
  let whiteWins = 0;
  let whiteDraws = 0;
  let whiteLosses = 0;
  let blackWins = 0;
  let blackDraws = 0;
  let blackLosses = 0;
  let ongoingGames = 0;

  tournaments.forEach((tournament) => {
    if (!matchedInitial && Array.isArray(tournament.initialRankings)) {
      const initMatch = tournament.initialRankings.find(
        (ir) => normalizeAthleteName(ir.name) === targetKey
      );
      if (initMatch) {
        matchedInitial = initMatch;
        if (fallbackTitle === 'Non-Gelar') {
          const fromInitTitle = normalizeMasterTitleCode(
            initMatch.title ?? extractTitleSuffix(initMatch.name)
          );
          if (fromInitTitle) fallbackTitle = fromInitTitle;
        }
      }
    }

    const standing = tournament.standings.find(
      (s) => normalizeAthleteName(s.name) === targetKey
    );

    if (standing) {
      if (!matchedStanding) {
        matchedStanding = standing;
      }
      if (!registeredAthlete && standing.name) {
        const cleanStandingName = stripTitleSuffix(standing.name);
        if (cleanStandingName.length > fallbackDisplayName.length || fallbackDisplayName === 'Isma Yudi') {
          fallbackDisplayName = cleanStandingName;
        }
        if (standing.title && standing.title !== 'Non-Gelar') {
          fallbackTitle = standing.title;
        }
      }
      standingsRecords.push({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        date:
          tournament.id === 'trn-kejurkot-2026'
            ? '5 Juli 2026'
            : `${tournament.startDate} – ${tournament.endDate}`,
        timeControlCategory: tournament.timeControlCategory,
        rank: standing.rank,
        totalParticipants: tournament.standings.length || tournament.participantsCount,
        pointsDisplay: standing.pointsDisplay ?? standing.points.toFixed(1),
        bhDisplay: standing.bhDisplay ?? standing.buchholz.toFixed(1),
        sb: standing.sb,
        ps: standing.ps,
        ratingChange: standing.ratingChange,
      });
    }

    const tournamentSeed = standing?.sNo;
    const sortedPairings = [...tournament.pairings].sort((a, b) =>
      a.round !== b.round ? a.round - b.round : a.board - b.board
    );
    const seenRoundsInTournament = new Set<number>();

    sortedPairings.forEach((pairing) => {
      const matchesWhite =
        normalizeAthleteName(pairing.whiteName) === targetKey ||
        (tournamentSeed !== undefined && pairing.whiteSeed === tournamentSeed);
      const matchesBlack =
        normalizeAthleteName(pairing.blackName) === targetKey ||
        (tournamentSeed !== undefined && pairing.blackSeed === tournamentSeed);

      if (!matchesWhite && !matchesBlack) return;
      if (seenRoundsInTournament.has(pairing.round)) return;
      seenRoundsInTournament.add(pairing.round);

      const color: 'Putih' | 'Hitam' = matchesWhite ? 'Putih' : 'Hitam';
      const { outcome, isForfeit } = evaluatePairingOutcome(pairing.result, color);

      if (outcome === 'Berlangsung') {
        ongoingGames += 1;
        return;
      }

      if (color === 'Putih') {
        if (outcome === 'Menang') whiteWins += 1;
        else if (outcome === 'Remis') whiteDraws += 1;
        else whiteLosses += 1;
      } else {
        if (outcome === 'Menang') blackWins += 1;
        else if (outcome === 'Remis') blackDraws += 1;
        else blackLosses += 1;
      }

      matches.push({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        tournamentStatus: tournament.status,
        timeControlCategory: tournament.timeControlCategory,
        round: pairing.round,
        board: pairing.board,
        color,
        playerNameInMatch: matchesWhite ? pairing.whiteName : pairing.blackName,
        playerPoints: matchesWhite ? pairing.whitePoints : pairing.blackPoints,
        opponentName: matchesWhite ? pairing.blackName : pairing.whiteName,
        opponentSeed: matchesWhite ? pairing.blackSeed : pairing.whiteSeed,
        opponentPoints: matchesWhite ? pairing.blackPoints : pairing.whitePoints,
        result: pairing.result,
        outcome,
        isForfeit,
      });
    });
  });

  const whiteStats = finalizeColorStats(whiteWins, whiteDraws, whiteLosses);
  const blackStats = finalizeColorStats(blackWins, blackDraws, blackLosses);
  const totalStats = finalizeColorStats(
    whiteWins + blackWins,
    whiteDraws + blackDraws,
    whiteLosses + blackLosses
  );

  const resolvedCity = registeredAthlete
    ? getAthleteCity(registeredAthlete)
    : matchedInitial?.clubCity
      ? inferAthleteCity(matchedInitial.clubCity)
      : matchedStanding?.club
        ? inferAthleteCity(matchedStanding.club)
        : 'Kota Batam';

  return {
    key: targetKey,
    fullName: registeredAthlete?.fullName ?? fallbackDisplayName,
    title: fallbackTitle,
    coachTitle: registeredAthlete?.coachTitle,
    arbiterTitle: registeredAthlete?.arbiterTitle,
    fed: matchedStanding?.fed ?? matchedInitial?.fed ?? (registeredAthlete ? 'INA' : undefined),
    category:
      registeredAthlete?.category ??
      matchedStanding?.category ??
      'Peserta Turnamen',
    club:
      registeredAthlete?.club ??
      (matchedStanding?.club && matchedStanding.club !== '-'
        ? matchedStanding.club
        : 'Peserta Turnamen PERCASI Kepulauan Riau'),
    city: resolvedCity,
    district:
      registeredAthlete?.district && registeredAthlete.district !== '-'
        ? registeredAthlete.district
        : undefined,
    birthDate: registeredAthlete?.birthDate,
    birthYear: registeredAthlete?.birthYear,
    age: calculateAthleteAge(
      registeredAthlete?.birthDate,
      registeredAthlete?.birthYear
    ),
    photoUrl: registeredAthlete?.photoUrl,
    federationStatus: registeredAthlete?.federationStatus,
    bio:
      registeredAthlete?.bio ||
      `Peserta turnamen resmi asal ${resolvedCity} yang tercatat dalam arsip pertandingan PERCASI.`,
    ratings: registeredAthlete?.ratings,
    tournamentRating:
      matchedStanding?.rating ??
      matchedInitial?.rating ??
      matchedInitial?.nationalRating,
    seedNumber: matchedStanding?.sNo ?? matchedInitial?.sNo,
    registeredAthlete,
    totalStats,
    whiteStats,
    blackStats,
    ongoingGames,
    matches,
    standingsRecords,
  };
}

export function parseInitialRankNumericRating(
  value: number | string | undefined
): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '-') return 0;
    const parsed = Number.parseInt(trimmed.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

export function sortInitialRankings(
  entries: InitialRankEntry[]
): InitialRankEntry[] {
  return [...entries]
    .sort((a, b) => {
      const ratingA = Math.max(
        parseInitialRankNumericRating(a.rating),
        parseInitialRankNumericRating(a.nationalRating),
        parseInitialRankNumericRating(a.internationalRating)
      );
      const ratingB = Math.max(
        parseInitialRankNumericRating(b.rating),
        parseInitialRankNumericRating(b.nationalRating),
        parseInitialRankNumericRating(b.internationalRating)
      );
      if (ratingA > 0 && ratingB > 0) {
        if (ratingA !== ratingB) return ratingB - ratingA;
      } else if (ratingA > 0) {
        return -1;
      } else if (ratingB > 0) {
        return 1;
      }
      const nameCmp = a.name
        .trim()
        .localeCompare(b.name.trim(), 'id', { sensitivity: 'base' });
      if (nameCmp !== 0) return nameCmp;
      return (a.sNo ?? 0) - (b.sNo ?? 0);
    })
    .map((entry, idx) => ({
      ...entry,
      sNo: idx + 1,
    }));
}

export function buildInitialRankings(
  standings: StandingEntry[],
  customInitialRankings?: InitialRankEntry[]
): InitialRankEntry[] {
  if (customInitialRankings && customInitialRankings.length > 0) {
    return [...customInitialRankings].sort((a, b) => a.sNo - b.sNo);
  }
  return [...standings]
    .sort((a, b) => {
      const seedA = a.sNo ?? a.rank;
      const seedB = b.sNo ?? b.rank;
      if (seedA !== seedB) return seedA - seedB;
      const ratingA = typeof a.rating === 'number' ? a.rating : 0;
      const ratingB = typeof b.rating === 'number' ? b.rating : 0;
      if (ratingA !== ratingB) return ratingB - ratingA;
      return a.name.localeCompare(b.name, 'id');
    })
    .map((row, idx) => ({
      sNo: row.sNo ?? idx + 1,
      name: row.name,
      rating: row.rating,
      fed: row.fed,
      category: row.category,
      title: row.title,
      club: row.club,
    }));
}

export function filterPairingsByRound(
  pairings: RoundPairing[],
  selectedRound: number | 'all'
): number[] {
  const roundNumbers = Array.from(new Set(pairings.map((p) => p.round))).sort(
    (a, b) => a - b
  );
  if (selectedRound === 'all') return roundNumbers;
  return roundNumbers.filter((rnd) => rnd === selectedRound);
}

export function resolvePublicAssetUrl(assetPath: string, baseUrl?: string): string {
  const cleanAsset = assetPath.replace(/^\.\//, '').replace(/^\/+/, '');
  const resolvedBase =
    baseUrl ??
    ((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './');
  if (!resolvedBase || resolvedBase === './') {
    return `./${cleanAsset}`;
  }
  const normalizedBase = resolvedBase.endsWith('/')
    ? resolvedBase
    : `${resolvedBase}/`;
  return `${normalizedBase}${cleanAsset}`;
}

function parseTimestampMs(iso?: string): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

export function pickAuthoritativePortalData(options: {
  seedData: PortalData;
  publishedData?: PortalData | null;
  localData?: PortalData | null;
  localEdited?: boolean;
  migrate: (data: PortalData) => PortalData;
}): PortalData {
  const { seedData, publishedData, localData, localEdited = false, migrate } = options;
  const seedMs = parseTimestampMs(seedData.updatedAt);
  const pubMs = publishedData ? parseTimestampMs(publishedData.updatedAt) : 0;

  const deployedBase =
    publishedData && pubMs >= seedMs ? migrate(publishedData) : migrate(seedData);
  const deployedMs = Math.max(seedMs, pubMs);

  if (!localData || !localEdited) {
    return deployedBase;
  }

  const localMs = parseTimestampMs(localData.updatedAt);
  if (localMs > deployedMs) {
    return migrate(localData);
  }
  return deployedBase;
}

export function calculateAthleteAge(
  birthDate?: string,
  birthYear?: number,
  referenceDate: Date = new Date()
): number | null {
  if (birthDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
    if (match) {
      const year = Number.parseInt(match[1], 10);
      const month = Number.parseInt(match[2], 10);
      const day = Number.parseInt(match[3], 10);
      const refYear = referenceDate.getFullYear();
      const refMonth = referenceDate.getMonth() + 1;
      const refDay = referenceDate.getDate();
      let age = refYear - year;
      if (refMonth < month || (refMonth === month && refDay < day)) {
        age -= 1;
      }
      return age >= 0 && age <= 120 ? age : null;
    }
  }
  if (birthYear && Number.isFinite(birthYear)) {
    const age = referenceDate.getFullYear() - birthYear;
    return age >= 0 && age <= 120 ? age : null;
  }
  return null;
}

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatAthleteBirthDisplay(
  birthDate?: string,
  birthYear?: number
): string {
  if (birthDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
    if (match) {
      const year = Number.parseInt(match[1], 10);
      const monthIdx = Number.parseInt(match[2], 10) - 1;
      const day = Number.parseInt(match[3], 10);
      const monthName = INDONESIAN_MONTHS[monthIdx];
      if (monthName && day >= 1 && day <= 31) {
        return `${day} ${monthName} ${year}`;
      }
    }
    return birthDate;
  }
  if (birthYear && Number.isFinite(birthYear)) {
    return `Tahun ${birthYear}`;
  }
  return '-';
}


