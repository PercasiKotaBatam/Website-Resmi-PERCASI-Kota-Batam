import {
  FIRDAUS_CUP_ROUND_1_PAIRINGS,
  FIRDAUS_CUP_ROUND_2_PAIRINGS,
  FIRDAUS_CUP_ROUND_3_PAIRINGS,
  FIRDAUS_CUP_ROUND_4_PAIRINGS,
  FIRDAUS_CUP_ROUND_5_PAIRINGS,
  FIRDAUS_CUP_ROUND_6_PAIRINGS,
  FIRDAUS_CUP_ROUND_7_PAIRINGS,
  FIRDAUS_CUP_STANDINGS,
  SEED_PORTAL_DATA,
} from '../data/seedData';
import type { PortalData } from '../types/chess';
import { validatePortalBackup } from './portalLogic';

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
  return {
    ...data,
    athletes: data.athletes.map((a) => ({
      ...a,
      tournamentHistory: a.tournamentHistory
        .filter(
          (rec) => rec.tournamentName !== 'Batam Rapid Open — Piala Wali Kota 2026'
        )
        .map((rec) =>
          rec.tournamentName === 'Kejurkot Catur Kota Batam 2026' &&
          rec.category === 'Standard'
            ? { ...rec, category: 'Catur Cepat' }
            : rec
        ),
    })),
    tournaments: data.tournaments
      .filter((t) => !REMOVED_TOURNAMENT_IDS.has(t.id))
      .map((t) => {
        if (t.id !== 'trn-kejurkot-2026') return t;
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
          standings:
            t.standings.length === 0 ? FIRDAUS_CUP_STANDINGS : t.standings,
          pairings:
            t.pairings.length > FIRDAUS_CUP_CANONICAL_PAIRINGS.length ||
            t.pairings.length === 0
              ? FIRDAUS_CUP_CANONICAL_PAIRINGS
              : t.pairings,
        };
      }),
    news: data.news.filter((n) => !REMOVED_NEWS_IDS.has(n.id)),
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
