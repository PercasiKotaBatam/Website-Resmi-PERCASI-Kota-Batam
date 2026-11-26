import crypto from 'node:crypto';

export interface AdminConfigStatus {
  configured: boolean;
  source: 'env' | 'claimed' | 'unconfigured';
}

interface StoredAdminCredential {
  username: string;
  salt: string;
  hash: string;
}

interface SessionPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
}

export interface AdminAuthService {
  getStatus: () => AdminConfigStatus;
  setupFirstAdmin: (
    username: string,
    password: string
  ) => { ok: true; token: string; username: string } | { ok: false; status: number; error: string };
  login: (
    username: string,
    password: string
  ) => { ok: true; token: string; username: string } | { ok: false; status: number; error: string };
  verifyBearerToken: (authHeader: string | undefined) => { valid: true; username: string } | { valid: false };
  revokeBearerToken: (authHeader: string | undefined) => void;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function hashPasswordWithSalt(password: string, salt: string): Buffer {
  return crypto.scryptSync(password, salt, 64);
}

function safeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function createAdminAuthService(
  getEnv: () => NodeJS.ProcessEnv = () => process.env
): AdminAuthService {
  const runtimeSecret = getEnv().ADMIN_SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
  let claimedCredential: StoredAdminCredential | null = null;
  const revokedTokens = new Map<string, number>();

  const getEnvCredentials = (): { username: string; password: string } | null => {
    const env = getEnv();
    const envUser = env.ADMIN_USERNAME?.trim() ?? '';
    const envPass = env.ADMIN_PASSWORD ?? '';
    if (envUser.length > 0 && envPass.length > 0) {
      return { username: envUser, password: envPass };
    }
    return null;
  };

  const getStatus = (): AdminConfigStatus => {
    if (getEnvCredentials()) {
      return { configured: true, source: 'env' };
    }
    if (claimedCredential) {
      return { configured: true, source: 'claimed' };
    }
    return { configured: false, source: 'unconfigured' };
  };

  const issueToken = (username: string): string => {
    const now = Date.now();
    const payload: SessionPayload = {
      sub: username,
      jti: crypto.randomUUID(),
      iat: now,
      exp: now + SESSION_TTL_MS,
    };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto
      .createHmac('sha256', runtimeSecret)
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${sig}`;
  };

  const parseAndVerifyToken = (token: string): SessionPayload | null => {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    if (!encoded || !sig) return null;

    const expectedSig = crypto
      .createHmac('sha256', runtimeSecret)
      .update(encoded)
      .digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8')
      ) as Partial<SessionPayload>;
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.jti !== 'string' ||
        typeof payload.exp !== 'number'
      ) {
        return null;
      }
      const now = Date.now();
      for (const [tokenId, exp] of revokedTokens.entries()) {
        if (exp <= now) revokedTokens.delete(tokenId);
      }
      if (payload.exp <= now || revokedTokens.has(payload.jti)) {
        return null;
      }
      return payload as SessionPayload;
    } catch {
      return null;
    }
  };

  const setupFirstAdmin = (
    username: string,
    password: string
  ): { ok: true; token: string; username: string } | { ok: false; status: number; error: string } => {
    if (getEnvCredentials() || claimedCredential) {
      return {
        ok: false,
        status: 409,
        error: 'Akun admin sudah dikonfigurasi. Silakan masuk menggunakan formulir login.',
      };
    }
    const cleanUser = username.trim();
    if (cleanUser.length < 3 || cleanUser.length > 64) {
      return {
        ok: false,
        status: 400,
        error: 'Username admin harus terdiri dari 3–64 karakter.',
      };
    }
    if (password.length < 8 || password.length > 128) {
      return {
        ok: false,
        status: 400,
        error: 'Password admin minimal 8 karakter dan maksimal 128 karakter.',
      };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const derived = hashPasswordWithSalt(password, salt).toString('hex');
    claimedCredential = {
      username: cleanUser,
      salt,
      hash: derived,
    };

    const token = issueToken(cleanUser);
    return { ok: true, token, username: cleanUser };
  };

  const login = (
    username: string,
    password: string
  ): { ok: true; token: string; username: string } | { ok: false; status: number; error: string } => {
    const cleanUser = username.trim();
    if (!cleanUser || !password || cleanUser.length > 64 || password.length > 128) {
      return {
        ok: false,
        status: 400,
        error: 'Username dan password wajib diisi.',
      };
    }

    const envCreds = getEnvCredentials();
    if (envCreds) {
      const salt = crypto.randomBytes(16).toString('hex');
      const expectedDigest = hashPasswordWithSalt(envCreds.password, salt);
      const actualDigest = hashPasswordWithSalt(password, salt);
      const userOk = safeStringEqual(cleanUser, envCreds.username);
      const passOk = crypto.timingSafeEqual(expectedDigest, actualDigest);

      if (!userOk || !passOk) {
        return {
          ok: false,
          status: 401,
          error: 'Username atau password admin tidak sesuai.',
        };
      }
      return { ok: true, token: issueToken(envCreds.username), username: envCreds.username };
    }

    if (!claimedCredential) {
      return {
        ok: false,
        status: 409,
        error: 'Kredensial admin belum diatur. Lakukan aktivasi akun admin terlebih dahulu.',
      };
    }

    const derived = hashPasswordWithSalt(password, claimedCredential.salt);
    const expectedHash = Buffer.from(claimedCredential.hash, 'hex');
    const userOk = safeStringEqual(cleanUser, claimedCredential.username);
    const passOk =
      derived.length === expectedHash.length &&
      crypto.timingSafeEqual(derived, expectedHash);

    if (!userOk || !passOk) {
      return {
        ok: false,
        status: 401,
        error: 'Username atau password admin tidak sesuai.',
      };
    }

    return {
      ok: true,
      token: issueToken(claimedCredential.username),
      username: claimedCredential.username,
    };
  };

  const verifyBearerToken = (
    authHeader: string | undefined
  ): { valid: true; username: string } | { valid: false } => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false };
    }
    const token = authHeader.slice('Bearer '.length).trim();
    const payload = parseAndVerifyToken(token);
    if (!payload) return { valid: false };
    return { valid: true, username: payload.sub };
  };

  const revokeBearerToken = (authHeader: string | undefined): void => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return;
    const token = authHeader.slice('Bearer '.length).trim();
    const payload = parseAndVerifyToken(token);
    if (payload) {
      revokedTokens.set(payload.jti, payload.exp);
    }
  };

  return {
    getStatus,
    setupFirstAdmin,
    login,
    verifyBearerToken,
    revokeBearerToken,
  };
}
