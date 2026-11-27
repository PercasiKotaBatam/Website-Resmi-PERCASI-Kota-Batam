import {
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
} from '../data/seedData';
import type { Athlete, PortalData } from '../types/chess';
import { normalizeAthleteName, validatePortalBackup } from './portalLogic';

const STORAGE_KEY = 'percasi_batam_portal_v3';

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

  return {
    ...data,
    athletes: [...cleanedAthletes, ...missingSeedAthletes],
    tournaments: safeTournaments
      .filter((t) => !REMOVED_TOURNAMENT_IDS.has(t.id))
      .map((t) => {
        const safeStandings = Array.isArray(t.standings) ? t.standings : [];
        const safePairings = Array.isArray(t.pairings) ? t.pairings : [];
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
      }),
    news: safeNews.filter((n) => !REMOVED_NEWS_IDS.has(n.id)),
  };
}

export function loadPortalData(): PortalData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return SEED_PORTAL_DATA;
    }
    const validation = validatePortalBackup(raw);
    if (validation.valid && validation.data) {
      return migratePortalData(validation.data);
    }
    return SEED_PORTAL_DATA;
  } catch {
    return SEED_PORTAL_DATA;
  }
}

export function savePortalData(data: PortalData): boolean {
  try {
    const payload: PortalData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function resetPortalData(): PortalData {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PORTAL_DATA));
  } catch {
    // Ignore storage errors if private browsing blocks persistence
  }
  return SEED_PORTAL_DATA;
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
