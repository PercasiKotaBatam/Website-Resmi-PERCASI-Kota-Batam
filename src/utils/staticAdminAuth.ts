const STATIC_ADMIN_STORAGE_KEY = 'percasi_batam_static_admin_v1';
export const STATIC_ADMIN_TOKEN_PREFIX = 'static-local:';

interface StoredStaticAdminRecord {
  username: string;
  saltHex: string;
  hashHex: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function deriveKeyHex(password: string, salt: Uint8Array): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('WebCrypto tidak tersedia di peramban ini.');
  }
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const saltCopy = new Uint8Array(salt.byteLength);
  saltCopy.set(salt);
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltCopy.buffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );
  return toHex(new Uint8Array(derivedBits));
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isStaticAdminToken(token: string | null | undefined): boolean {
  return Boolean(token && token.startsWith(STATIC_ADMIN_TOKEN_PREFIX));
}

export function hasStaticAdminClaimed(): boolean {
  try {
    const raw = window.localStorage.getItem(STATIC_ADMIN_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<StoredStaticAdminRecord>;
    return Boolean(
      typeof parsed.username === 'string' &&
        parsed.username.length >= 3 &&
        typeof parsed.saltHex === 'string' &&
        typeof parsed.hashHex === 'string'
    );
  } catch {
    return false;
  }
}

export function clearStaticAdmin(): void {
  try {
    window.localStorage.removeItem(STATIC_ADMIN_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

export async function setupStaticAdmin(
  username: string,
  password: string
): Promise<{ ok: true; username: string; token: string } | { ok: false; error: string }> {
  const cleanUser = username.trim();
  if (cleanUser.length < 3 || cleanUser.length > 64) {
    return { ok: false, error: 'Username admin harus terdiri dari 3–64 karakter.' };
  }
  if (password.length < 8 || password.length > 128) {
    return { ok: false, error: 'Password admin minimal 8 karakter dan maksimal 128 karakter.' };
  }

  try {
    const salt = new Uint8Array(16);
    window.crypto.getRandomValues(salt);
    const hashHex = await deriveKeyHex(password, salt);
    const record: StoredStaticAdminRecord = {
      username: cleanUser,
      saltHex: toHex(salt),
      hashHex,
    };
    window.localStorage.setItem(STATIC_ADMIN_STORAGE_KEY, JSON.stringify(record));
    return {
      ok: true,
      username: cleanUser,
      token: `${STATIC_ADMIN_TOKEN_PREFIX}${cleanUser}`,
    };
  } catch {
    return {
      ok: false,
      error: 'Gagal menyimpan akun admin lokal di peramban.',
    };
  }
}

export async function verifyStaticAdmin(
  username: string,
  password: string
): Promise<{ ok: true; username: string; token: string } | { ok: false; error: string }> {
  const cleanUser = username.trim();
  if (!cleanUser || !password) {
    return { ok: false, error: 'Username dan password wajib diisi.' };
  }
  try {
    const raw = window.localStorage.getItem(STATIC_ADMIN_STORAGE_KEY);
    if (!raw) {
      return {
        ok: false,
        error: 'Akun admin lokal belum diaktifkan di peramban ini.',
      };
    }
    const parsed = JSON.parse(raw) as Partial<StoredStaticAdminRecord>;
    if (
      typeof parsed.username !== 'string' ||
      typeof parsed.saltHex !== 'string' ||
      typeof parsed.hashHex !== 'string'
    ) {
      return {
        ok: false,
        error: 'Data akun admin lokal rusak. Silakan atur ulang.',
      };
    }
    const derivedHex = await deriveKeyHex(password, fromHex(parsed.saltHex));
    if (cleanUser !== parsed.username || !safeEqualHex(derivedHex, parsed.hashHex)) {
      return {
        ok: false,
        error: 'Username atau password admin tidak sesuai.',
      };
    }
    return {
      ok: true,
      username: parsed.username,
      token: `${STATIC_ADMIN_TOKEN_PREFIX}${parsed.username}`,
    };
  } catch {
    return {
      ok: false,
      error: 'Gagal memverifikasi akun admin lokal.',
    };
  }
}
