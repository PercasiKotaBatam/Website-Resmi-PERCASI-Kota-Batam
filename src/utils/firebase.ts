import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  getFirestore,
  onSnapshot,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Athlete, NewsArticle, PortalData, Tournament } from '../types/chess';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'percasikotabatam01@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    });
    return out as T;
  }
  return value;
}

const VALID_TITLES = new Set([
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
]);
const VALID_COACH_TITLES = new Set([
  'FST',
  'FT',
  'FI',
  'NI',
  'DI',
  'PN',
  'PNM',
  'PNP',
]);
const VALID_ARBITER_TITLES = new Set([
  'IA',
  'FA',
  'NA',
  'WN',
  'WNM',
  'WNP',
]);
const VALID_CATEGORIES = new Set([
  'Senior Putra',
  'Senior Putri',
  'Junior U-18',
  'Junior U-14',
  'Veteran',
]);
const VALID_TOURNAMENT_STATUS = new Set(['Akan Datang', 'Sedang Berlangsung', 'Selesai']);
const VALID_TIME_CONTROLS = new Set(['Standard', 'Catur Cepat', 'Rapid', 'Blitz']);
const VALID_NEWS_CATEGORIES = new Set(['Turnamen', 'Pembinaan', 'Pengumuman Resmi']);

function sanitizeDocId(raw: string, fallbackPrefix: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 128);
  return cleaned || `${fallbackPrefix}-${Date.now()}`;
}

export function sanitizeAthleteForFirestore(athlete: Athlete): Athlete {
  const legacy = athlete as Athlete & { percasiId?: string; fideId?: string };
  const { percasiId: _p, fideId: _f, ...rest } = legacy;
  const cleanId = sanitizeDocId(rest.id, 'ath');
  const cleanTitle = VALID_TITLES.has(rest.title) ? rest.title : 'Non-Gelar';
  const cleanCategory = VALID_CATEGORIES.has(rest.category)
    ? rest.category
    : 'Senior Putra';
  const cleanGender: 'Putra' | 'Putri' = rest.gender === 'Putri' ? 'Putri' : 'Putra';

  const sanitized: Athlete = {
    id: cleanId,
    fullName: (rest.fullName || 'Atlet Tanpa Nama').trim().slice(0, 160),
    title: cleanTitle,
    category: cleanCategory,
    gender: cleanGender,
    club: (rest.club || '-').trim().slice(0, 160) || '-',
    district: ((rest.district || '-') as Athlete['district']),
    ratings: {
      standard: Math.min(4000, Math.max(0, Number(rest.ratings?.standard) || 0)),
      rapid: Math.min(4000, Math.max(0, Number(rest.ratings?.rapid) || 0)),
      blitz: Math.min(4000, Math.max(0, Number(rest.ratings?.blitz) || 0)),
    },
    bio: (rest.bio ?? '').slice(0, 2000),
    federationStatus: 'Atlet',
    tournamentHistory: Array.isArray(rest.tournamentHistory)
      ? rest.tournamentHistory.slice(0, 100)
      : [],
  };

  if (rest.coachTitle && VALID_COACH_TITLES.has(rest.coachTitle)) {
    sanitized.coachTitle = rest.coachTitle;
  }
  if (rest.arbiterTitle && VALID_ARBITER_TITLES.has(rest.arbiterTitle)) {
    sanitized.arbiterTitle = rest.arbiterTitle;
  }
  if (rest.birthDate && rest.birthDate.trim()) {
    sanitized.birthDate = rest.birthDate.trim().slice(0, 32);
  }
  if (
    typeof rest.birthYear === 'number' &&
    rest.birthYear >= 1900 &&
    rest.birthYear <= 2030
  ) {
    sanitized.birthYear = rest.birthYear;
  }
  if (rest.city && rest.city.trim()) {
    sanitized.city = rest.city.trim().slice(0, 64) as Athlete['city'];
  }
  if (rest.photoUrl && rest.photoUrl.length <= 350000) {
    sanitized.photoUrl = rest.photoUrl;
  }

  return stripUndefinedDeep(sanitized);
}

export function sanitizeTournamentForFirestore(tournament: Tournament): Tournament {
  const cleanId = sanitizeDocId(tournament.id, 'trn');
  const sanitized: Tournament = {
    id: cleanId,
    name: (tournament.name || 'Turnamen Catur').trim().slice(0, 200),
    status: VALID_TOURNAMENT_STATUS.has(tournament.status)
      ? tournament.status
      : 'Akan Datang',
    startDate: (tournament.startDate || '2026').trim().slice(0, 64),
    endDate: (tournament.endDate || tournament.startDate || '2026').trim().slice(0, 64),
    venue: (tournament.venue || 'Kota Batam').trim().slice(0, 240),
    timeControlCategory: VALID_TIME_CONTROLS.has(tournament.timeControlCategory)
      ? tournament.timeControlCategory
      : 'Catur Cepat',
    timeControlDetail: (tournament.timeControlDetail || 'Sistem Swiss').trim().slice(0, 120),
    rounds: Math.min(30, Math.max(1, Number(tournament.rounds) || 7)),
    chiefArbiter: (tournament.chiefArbiter || 'Pengkot PERCASI Kota Batam').trim().slice(0, 160),
    organizer: (tournament.organizer || 'Pengkot PERCASI Kota Batam').trim().slice(0, 160),
    participantsCount: Math.min(2000, Math.max(0, Number(tournament.participantsCount) || 0)),
    description: (tournament.description ?? '').slice(0, 4000),
    standings: Array.isArray(tournament.standings)
      ? tournament.standings.slice(0, 1000)
      : [],
    pairings: Array.isArray(tournament.pairings)
      ? tournament.pairings.slice(0, 5000)
      : [],
  };

  if (Array.isArray(tournament.initialRankings)) {
    sanitized.initialRankings = tournament.initialRankings.slice(0, 1000);
  }

  return stripUndefinedDeep(sanitized);
}

export function sanitizeNewsForFirestore(article: NewsArticle): NewsArticle {
  const cleanId = sanitizeDocId(article.id, 'news');
  const sanitized: NewsArticle = {
    id: cleanId,
    title: (article.title || 'Berita PERCASI').trim().slice(0, 240),
    category: VALID_NEWS_CATEGORIES.has(article.category)
      ? article.category
      : 'Pengumuman Resmi',
    publishedAt: (article.publishedAt || '2026').trim().slice(0, 64),
    author: (article.author || 'Humas PERCASI Batam').trim().slice(0, 160),
    excerpt: (article.excerpt ?? '').slice(0, 600),
    content: Array.isArray(article.content)
      ? article.content.map((c) => String(c)).slice(0, 100)
      : [],
    imageUrl: (article.imageUrl ?? '').slice(0, 350000),
  };
  if (typeof article.featured === 'boolean') {
    sanitized.featured = article.featured;
  }
  return stripUndefinedDeep(sanitized);
}

export interface CloudPortalMetaDoc {
  version: string;
  updatedAt: string;
  updatedByUid: string;
  updatedByEmail?: string;
  athletesCount: number;
  tournamentsCount: number;
}

export async function checkIsFirebaseAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if ((user.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
    return true;
  }
  const adminPath = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, adminPath);
  }
}

export async function signInWithGoogleAdmin(): Promise<
  | { ok: true; user: User }
  | { ok: false; code?: string; error: string }
> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const allowed = await checkIsFirebaseAdmin(result.user);
    if (!allowed) {
      const emailUsed = result.user.email || 'akun ini';
      await signOut(auth);
      return {
        ok: false,
        error: `Akun Google (${emailUsed}) belum terdaftar sebagai Admin Pengkot PERCASI Batam. Silakan masuk menggunakan akun ${BOOTSTRAPPED_ADMIN_EMAIL}.`,
      };
    }
    return { ok: true, user: result.user };
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return {
        ok: false,
        code: err.code,
        error: 'Jendela login Google ditutup sebelum proses selesai.',
      };
    }
    if (err.code === 'auth/popup-blocked') {
      return {
        ok: false,
        code: err.code,
        error:
          'Popup login Google diblokir oleh peramban. Izinkan pop-up untuk situs ini lalu coba masuk lagi.',
      };
    }
    if (err.code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'domain ini';
      return {
        ok: false,
        code: err.code,
        error: `Domain "${host}" belum ditambahkan ke Authorized Domains di Firebase Authentication. Tambahkan "${host}" di Firebase Console (Authentication → Settings → Authorized domains) atau lakukan edit dari AI Studio karena perubahan tetap sinkron otomatis ke GitHub.`,
      };
    }
    return {
      ok: false,
      code: err.code,
      error: err.message || 'Gagal masuk menggunakan akun Google Admin.',
    };
  }
}

export async function signOutFirebaseAdmin(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore signout errors
  }
}

export function subscribeFirebaseAuthState(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

async function getDocFresh(ref: DocumentReference<DocumentData>) {
  try {
    return await getDocFromServer(ref);
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (
      code === 'unavailable' ||
      msg.includes('offline') ||
      msg.includes('failed to get document from server')
    ) {
      return await getDoc(ref);
    }
    throw err;
  }
}

async function getDocsFresh(colRef: CollectionReference<DocumentData>) {
  try {
    return await getDocsFromServer(colRef);
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (
      code === 'unavailable' ||
      msg.includes('offline') ||
      msg.includes('failed to get')
    ) {
      return await getDocs(colRef);
    }
    throw err;
  }
}

export async function fetchCloudPortalData(): Promise<PortalData | null> {
  const metaPath = 'portalMeta/state';
  let metaSnap;
  try {
    metaSnap = await getDocFresh(doc(db, 'portalMeta', 'state'));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, metaPath);
  }

  if (!metaSnap.exists()) {
    return null;
  }

  const meta = metaSnap.data() as Partial<CloudPortalMetaDoc>;
  let athletesSnap;
  try {
    athletesSnap = await getDocsFresh(collection(db, 'athletes'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'athletes');
  }

  let tournamentsSnap;
  try {
    tournamentsSnap = await getDocsFresh(collection(db, 'tournaments'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'tournaments');
  }

  let newsSnap;
  try {
    newsSnap = await getDocsFresh(collection(db, 'news'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'news');
  }

  const athletes = athletesSnap.docs.map((d) => d.data() as Athlete);
  const tournaments = tournamentsSnap.docs.map((d) => d.data() as Tournament);
  const news = newsSnap.docs.map((d) => d.data() as NewsArticle);

  return {
    version: meta.version || '2.0',
    updatedAt: meta.updatedAt || new Date().toISOString(),
    athletes,
    tournaments,
    news,
  };
}

export function subscribeCloudPortalData(
  onData: (data: PortalData) => void,
  onSyncError?: (error: Error) => void
): Unsubscribe {
  let lastSeenUpdatedAt = '';

  return onSnapshot(
    doc(db, 'portalMeta', 'state'),
    (metaSnap) => {
      if (!metaSnap.exists()) return;
      const meta = metaSnap.data() as Partial<CloudPortalMetaDoc>;
      const updatedAt = meta.updatedAt || '';
      if (updatedAt && updatedAt === lastSeenUpdatedAt) {
        return;
      }
      lastSeenUpdatedAt = updatedAt;

      void fetchCloudPortalData()
        .then((cloudData) => {
          if (cloudData) {
            onData(cloudData);
          }
        })
        .catch((err) => {
          if (onSyncError) {
            onSyncError(err instanceof Error ? err : new Error(String(err)));
          }
        });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'portalMeta/state');
      } catch (wrappedErr) {
        if (onSyncError) {
          onSyncError(
            wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr))
          );
        }
      }
    }
  );
}

interface BatchMutation {
  type: 'set' | 'delete';
  collectionName: 'athletes' | 'tournaments' | 'news' | 'portalMeta';
  id: string;
  payload?: unknown;
}

async function commitChunkedMutations(mutations: BatchMutation[]): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < mutations.length; i += CHUNK_SIZE) {
    const chunk = mutations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((m) => {
      const ref = doc(db, m.collectionName, m.id);
      if (m.type === 'delete') {
        batch.delete(ref);
      } else {
        batch.set(ref, m.payload);
      }
    });
    try {
      await batch.commit();
    } catch (error) {
      const firstPath = `${chunk[0]?.collectionName ?? 'unknown'}/${chunk[0]?.id ?? ''}`;
      handleFirestoreError(error, OperationType.WRITE, firstPath);
    }
  }
}

export async function publishPortalDataToCloud(
  nextData: PortalData,
  previousCloudData: PortalData | null,
  user: User
): Promise<void> {
  const mutations: BatchMutation[] = [];

  const nextAthletes = nextData.athletes.map(sanitizeAthleteForFirestore);
  const prevAthleteMap = new Map<string, string>();
  (previousCloudData?.athletes ?? []).forEach((a) => {
    const clean = sanitizeAthleteForFirestore(a);
    prevAthleteMap.set(clean.id, JSON.stringify(clean));
  });
  const nextAthleteIds = new Set<string>();
  nextAthletes.forEach((ath) => {
    nextAthleteIds.add(ath.id);
    const serialized = JSON.stringify(ath);
    if (prevAthleteMap.get(ath.id) !== serialized) {
      mutations.push({
        type: 'set',
        collectionName: 'athletes',
        id: ath.id,
        payload: ath,
      });
    }
  });
  (previousCloudData?.athletes ?? []).forEach((a) => {
    const cleanId = sanitizeDocId(a.id, 'ath');
    if (!nextAthleteIds.has(cleanId)) {
      mutations.push({
        type: 'delete',
        collectionName: 'athletes',
        id: cleanId,
      });
    }
  });

  const nextTournaments = nextData.tournaments.map(sanitizeTournamentForFirestore);
  const prevTournamentMap = new Map<string, string>();
  (previousCloudData?.tournaments ?? []).forEach((t) => {
    const clean = sanitizeTournamentForFirestore(t);
    prevTournamentMap.set(clean.id, JSON.stringify(clean));
  });
  const nextTournamentIds = new Set<string>();
  nextTournaments.forEach((trn) => {
    nextTournamentIds.add(trn.id);
    const serialized = JSON.stringify(trn);
    if (prevTournamentMap.get(trn.id) !== serialized) {
      mutations.push({
        type: 'set',
        collectionName: 'tournaments',
        id: trn.id,
        payload: trn,
      });
    }
  });
  (previousCloudData?.tournaments ?? []).forEach((t) => {
    const cleanId = sanitizeDocId(t.id, 'trn');
    if (!nextTournamentIds.has(cleanId)) {
      mutations.push({
        type: 'delete',
        collectionName: 'tournaments',
        id: cleanId,
      });
    }
  });

  const nextNews = nextData.news.map(sanitizeNewsForFirestore);
  const prevNewsMap = new Map<string, string>();
  (previousCloudData?.news ?? []).forEach((n) => {
    const clean = sanitizeNewsForFirestore(n);
    prevNewsMap.set(clean.id, JSON.stringify(clean));
  });
  const nextNewsIds = new Set<string>();
  nextNews.forEach((article) => {
    nextNewsIds.add(article.id);
    const serialized = JSON.stringify(article);
    if (prevNewsMap.get(article.id) !== serialized) {
      mutations.push({
        type: 'set',
        collectionName: 'news',
        id: article.id,
        payload: article,
      });
    }
  });
  (previousCloudData?.news ?? []).forEach((n) => {
    const cleanId = sanitizeDocId(n.id, 'news');
    if (!nextNewsIds.has(cleanId)) {
      mutations.push({
        type: 'delete',
        collectionName: 'news',
        id: cleanId,
      });
    }
  });

  const metaDoc: CloudPortalMetaDoc = {
    version: (nextData.version || '2.0').slice(0, 20),
    updatedAt: (nextData.updatedAt || new Date().toISOString()).slice(0, 64),
    updatedByUid: user.uid,
    updatedByEmail: (user.email || BOOTSTRAPPED_ADMIN_EMAIL).slice(0, 200),
    athletesCount: nextAthletes.length,
    tournamentsCount: nextTournaments.length,
  };

  mutations.push({
    type: 'set',
    collectionName: 'portalMeta',
    id: 'state',
    payload: metaDoc,
  });

  await commitChunkedMutations(mutations);
}

export async function bootstrapCloudIfEmpty(
  currentPortalData: PortalData,
  user: User
): Promise<{ seeded: boolean; cloudData: PortalData | null }> {
  let metaSnap;
  try {
    metaSnap = await getDocFresh(doc(db, 'portalMeta', 'state'));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'portalMeta/state');
  }

  if (!metaSnap.exists()) {
    await publishPortalDataToCloud(currentPortalData, null, user);
    return { seeded: true, cloudData: currentPortalData };
  }

  const cloudData = await fetchCloudPortalData();
  return { seeded: false, cloudData };
}
