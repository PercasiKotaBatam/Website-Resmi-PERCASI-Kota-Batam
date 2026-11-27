import {
  DARWIN_CUP_INITIAL_RANKINGS,
  FIRDAUS_CUP_INITIAL_RANKINGS,
  FIRDAUS_CUP_ROUND_1_PAIRINGS,
  FIRDAUS_CUP_ROUND_2_PAIRINGS,
  FIRDAUS_CUP_ROUND_3_PAIRINGS,
  FIRDAUS_CUP_ROUND_4_PAIRINGS,
  FIRDAUS_CUP_ROUND_5_PAIRINGS,
  FIRDAUS_CUP_ROUND_6_PAIRINGS,
  FIRDAUS_CUP_ROUND_7_PAIRINGS,
  FIRDAUS_CUP_STANDINGS,
  SEED_ATHLETES,
  SEED_PORTAL_DATA,
  SEED_TOURNAMENTS,
} from '../data/seedData';
import type { Athlete, PortalData } from '../types/chess';
import {
  normalizeAthleteName,
  pickAuthoritativePortalData,
  resolvePublicAssetUrl,
  validatePortalBackup,
} from './portalLogic';

const STORAGE_KEY = 'percasi_batam_portal_v3';
const STORAGE_META_KEY = 'percasi_batam_portal_meta_v3';

interface PortalStorageMeta {
  localEdited: boolean;
  updatedAt?: string;
}

const FIRDAUS_CUP_CANONICAL_PAIRINGS = [
  ...FIRDAUS_CUP_ROUND_1_PAIRINGS,
  ...FIRDAUS_CUP_ROUND_2_PAIRINGS,
  ...FIRDAUS_CUP_ROUND_3_PAIRINGS,
  ...FIRDAUS_CUP_ROUND_4_PAIRINGS,
  ...FIRDAUS_CUP_ROUND_5_PAIRINGS,
  ...FIRDAUS_CUP_ROUND_6_PAIRINGS,
  ...FIRDAUS_CUP_ROUND_7_PAIRINGS,
];

const REMOVED_TOURNAMENT_IDS = new Set([
  'trn-rapid-walikota-2026',
  'trn-sirkuit-sekupang-2026',
]);

const REMOVED_NEWS_IDS = new Set([
  'news-01',
  'news-02',
  'news-03',
  'news-04',
]);

export function migratePortalData(data: PortalData): PortalData {
  const safeAthletes = Array.isArray(data.athletes) ? data.athletes : [];
  const safeTournaments = Array.isArray(data.tournaments) ? data.tournaments : [];
  const safeNews = Array.isArray(data.news) ? data.news : [];

  const cleanedAthletes: Athlete[] = safeAthletes.map((a) => {
    const legacy = a as Athlete & { percasiId?: string; fideId?: string };
    const { percasiId: _percasiId, fideId: _fideId, ...rest } = legacy;
    return {
      ...rest,
      ratings: rest.ratings ?? { standard: 0, rapid: 0, blitz: 0 },
      federationStatus: 'Atlet',
      tournamentHistory: (Array.isArray(rest.tournamentHistory)
        ? rest.tournamentHistory
        : []
      )
        .filter(
          (rec) => rec.tournamentName !== 'Batam Rapid Open — Piala Wali Kota 2026'
        )
        .map((rec) =>
          rec.tournamentName === 'Kejurkot Catur Kota Batam 2026' &&
          rec.category === 'Standard'
            ? { ...rec, category: 'Catur Cepat' }
            : rec
        ),
    };
  });

  const existingNames = new Set(
    cleanedAthletes.map((a) => normalizeAthleteName(a.fullName))
  );
  const missingSeedAthletes = SEED_ATHLETES.filter(
    (seedAth) => !existingNames.has(normalizeAthleteName(seedAth.fullName))
  );

  const migratedTournaments = safeTournaments
    .filter((t) => !REMOVED_TOURNAMENT_IDS.has(t.id))
    .map((t) => {
      const safeStandings = Array.isArray(t.standings) ? t.standings : [];
      const safePairings = Array.isArray(t.pairings) ? t.pairings : [];
      const isDarwinCup =
        t.id === 'trn-darwin-cup-2026' || /\bdarwin\s*cup/i.test(t.name);

      if (isDarwinCup) {
        const needsDarwinInitialUpgrade =
          !Array.isArray(t.initialRankings) ||
          t.initialRankings.length < DARWIN_CUP_INITIAL_RANKINGS.length ||
          t.initialRankings.some((row) => row.gender === undefined && row.clubCity === undefined);
        return {
          ...t,
          participantsCount: Math.max(
            t.participantsCount || 0,
            DARWIN_CUP_INITIAL_RANKINGS.length
          ),
          initialRankings: needsDarwinInitialUpgrade
            ? DARWIN_CUP_INITIAL_RANKINGS
            : t.initialRankings,
          standings: safeStandings,
          pairings: safePairings,
        };
      }

      if (t.id !== 'trn-kejurkot-2026') {
        return {
          ...t,
          standings: safeStandings,
          pairings: safePairings,
        };
      }
      const isLegacyNameOrTc =
        t.name === 'Kejurkot Catur Kota Batam 2026' ||
        t.timeControlCategory === 'Standard';
      const isLegacyVenueOrDate =
        t.venue === 'Atrium Utama DC Mall Batam' ||
        t.startDate === '14 Nov 2026';
      return {
        ...t,
        name: isLegacyNameOrTc ? 'Firdaus Cup 2026' : t.name,
        startDate: isLegacyVenueOrDate ? '5 Juli 2026' : t.startDate,
        endDate: isLegacyVenueOrDate ? '5 Juli 2026' : t.endDate,
        venue: isLegacyVenueOrDate
          ? 'Kampung Tua Belian, Batam Center, Kota Batam'
          : t.venue,
        chiefArbiter:
          t.chiefArbiter === 'WN Agus Kurniawan, FA' && isLegacyVenueOrDate
            ? 'Aldriyanto Syarif, PNP, WNM'
            : t.chiefArbiter,
        timeControlCategory: isLegacyNameOrTc ? 'Catur Cepat' : t.timeControlCategory,
        timeControlDetail: isLegacyNameOrTc
          ? '10 menit + 3 detik'
          : t.timeControlDetail,
        description: isLegacyNameOrTc ? '' : t.description,
        initialRankings:
          !Array.isArray(t.initialRankings) ||
          t.initialRankings.length < FIRDAUS_CUP_INITIAL_RANKINGS.length
            ? FIRDAUS_CUP_INITIAL_RANKINGS
            : t.initialRankings,
        standings:
          safeStandings.length === 0 ? FIRDAUS_CUP_STANDINGS : safeStandings,
        pairings:
          safePairings.length === 0 ||
          safePairings.some(
            (p, i) =>
              safePairings.findIndex(
                (q, j) =>
                  j !== i &&
                  q.round === p.round &&
                  (q.board === p.board ||
                    normalizeAthleteName(q.whiteName) ===
                      normalizeAthleteName(p.whiteName) ||
                    normalizeAthleteName(q.blackName) ===
                      normalizeAthleteName(p.blackName))
              ) >= 0
          )
            ? FIRDAUS_CUP_CANONICAL_PAIRINGS
            : safePairings,
      };
    });

  const hasDarwinCup = migratedTournaments.some(
    (t) => t.id === 'trn-darwin-cup-2026' || /\bdarwin\s*cup/i.test(t.name)
  );
  const darwinSeed = SEED_TOURNAMENTS.find(
    (t) => t.id === 'trn-darwin-cup-2026'
  );
  if (!hasDarwinCup && darwinSeed) {
    migratedTournaments.push(darwinSeed);
  }

  return {
    ...data,
    athletes: [...cleanedAthletes, ...missingSeedAthletes],
    tournaments: migratedTournaments,
    news: safeNews.filter((n) => !REMOVED_NEWS_IDS.has(n.id)),
  };
}

export function readLocalPortalSnapshot(): {
  data: PortalData | null;
  localEdited: boolean;
} {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { data: null, localEdited: false };
    }
    const validation = validatePortalBackup(raw);
    if (!validation.valid || !validation.data) {
      return { data: null, localEdited: false };
    }
    let localEdited = false;
    const rawMeta = window.localStorage.getItem(STORAGE_META_KEY);
    if (rawMeta) {
      const parsedMeta = JSON.parse(rawMeta) as Partial<PortalStorageMeta>;
      localEdited = Boolean(parsedMeta.localEdited);
    }
    return { data: validation.data, localEdited };
  } catch {
    return { data: null, localEdited: false };
  }
}

export function loadPortalData(): PortalData {
  const { data, localEdited } = readLocalPortalSnapshot();
  return pickAuthoritativePortalData({
    seedData: SEED_PORTAL_DATA,
    localData: data,
    localEdited,
    migrate: migratePortalData,
  });
}

export function savePortalData(
  data: PortalData,
  markLocalEdited = true
): PortalData {
  const payload: PortalData = {
    ...data,
    updatedAt: markLocalEdited ? new Date().toISOString() : data.updatedAt,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const meta: PortalStorageMeta = {
      localEdited: markLocalEdited,
      updatedAt: payload.updatedAt,
    };
    window.localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage errors if private browsing blocks persistence
  }
  return payload;
}

export function resetPortalData(): PortalData {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_META_KEY);
  } catch {
    // Ignore storage errors if private browsing blocks persistence
  }
  return SEED_PORTAL_DATA;
}

export async function fetchPublishedPortalData(): Promise<PortalData | null> {
  try {
    const url = `${resolvePublicAssetUrl('data/portal-data.json')}?v=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const text = await res.text();
    const validation = validatePortalBackup(text);
    if (!validation.valid || !validation.data) return null;
    return validation.data;
  } catch {
    return null;
  }
}

export async function syncPortalDataToServer(
  data: PortalData,
  adminToken: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/portal-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let errMsg = 'Gagal menyinkronkan data ke repositori proyek.';
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) errMsg = body.error;
      } catch {
        // ignore JSON parse failure on non-JSON response (e.g. static host 404/405)
      }
      return { ok: false, error: errMsg };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Server penyinkronan tidak tersedia pada hosting statis.' };
  }
}

export async function compressImageToBase64(
  file: File,
  maxDimension = 360,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const img = new Image();
      img.onerror = () => reject(new Error('Berkas bukan gambar yang valid.'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBinaryFile(
  filename: string,
  bytes: Uint8Array,
  mimeType: string
): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
