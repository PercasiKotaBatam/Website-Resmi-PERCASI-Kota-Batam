import { Cloud, Eye, EyeOff, KeyRound, RotateCcw, ShieldCheck, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { BOOTSTRAPPED_ADMIN_EMAIL, signInWithGoogleAdmin } from '../utils/firebase';
import {
  clearStaticAdmin,
  hasStaticAdminClaimed,
  setupStaticAdmin,
  verifyStaticAdmin,
} from '../utils/staticAdminAuth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, username: string, firebaseUser?: User) => void;
}

interface AdminStatusResponse {
  configured: boolean;
  source: 'env' | 'claimed' | 'unconfigured';
}

type AuthBackendMode = 'server' | 'static';

export function AdminLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [backendMode, setBackendMode] = useState<AuthBackendMode>('server');
  const [configured, setConfigured] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setGoogleSubmitting(false);
    setStatusLoading(true);

    fetch('/api/admin/status', { cache: 'no-store' })
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error('STATIC_HOST');
        }
        return (await res.json()) as AdminStatusResponse;
      })
      .then((data) => {
        if (!cancelled) {
          setBackendMode('server');
          setConfigured(Boolean(data.configured));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendMode('static');
          setConfigured(hasStaticAdminClaimed());
        }
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleResetStaticAdmin = () => {
    clearStaticAdmin();
    setConfigured(false);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      const result = await signInWithGoogleAdmin();
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      onSuccess(
        `firebase:${result.user.uid}`,
        result.user.email || BOOTSTRAPPED_ADMIN_EMAIL,
        result.user
      );
      onClose();
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    if (!configured && password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      if (backendMode === 'static') {
        const result = configured
          ? await verifyStaticAdmin(cleanUsername, password)
          : await setupStaticAdmin(cleanUsername, password);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSuccess(result.token, result.username);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        onClose();
        return;
      }

      const endpoint = configured ? '/api/admin/login' : '/api/admin/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setBackendMode('static');
        setConfigured(hasStaticAdminClaimed());
        setError('Server backend tidak tersedia. Dialihkan ke Mode Admin Lokal.');
        return;
      }

      const payload = (await res.json()) as {
        token?: string;
        username?: string;
        error?: string;
      };

      if (!res.ok || !payload.token) {
        setError(payload.error || 'Autentikasi gagal. Periksa kembali kredensial Anda.');
        return;
      }

      onSuccess(payload.token, payload.username || cleanUsername);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch {
      setError('Gagal terhubung ke layanan autentikasi admin. Periksa koneksi lalu coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStatic = backendMode === 'static';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0F2342] text-white">
              {configured ? (
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2
                id="admin-login-title"
                className="text-base font-extrabold text-[#0F2342]"
              >
                Masuk Mode Admin
              </h2>
              <p className="text-[11px] text-slate-500">
                Otorisasi Pengurus PERCASI Kota Batam
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog login admin"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {statusLoading ? (
          <div className="p-6 text-center text-sm text-slate-600">
            Memeriksa status keamanan admin...
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {/* Primary Cloud Sync Login (Google Admin) */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-start gap-2.5">
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-emerald-950">
                    Sinkronisasi Cloud (AI Studio &amp; GitHub Pages)
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-900">
                    Masuk dengan akun Google Admin{' '}
                    <span className="font-mono font-semibold">{BOOTSTRAPPED_ADMIN_EMAIL}</span>{' '}
                    agar semua edit keanggotaan, turnamen, dan pairing tersimpan permanen di cloud dan langsung sama di AI Studio maupun GitHub.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleSubmitting || submitting}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white transition-colors hover:bg-[#173360] disabled:opacity-60"
              >
                <Cloud className="h-4 w-4" aria-hidden="true" />
                <span>
                  {googleSubmitting
                    ? 'Menghubungkan akun Google...'
                    : 'Masuk dengan Google Admin'}
                </span>
              </button>
            </div>

            <div className="relative flex items-center py-1">
              <div className="grow border-t border-slate-200" />
              <span className="mx-3 shrink-0 text-[11px] font-semibold text-slate-400">
                atau login {isStatic ? 'lokal' : 'server'}
              </span>
              <div className="grow border-t border-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isStatic && !configured && (
                <div className="rounded-md border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs leading-relaxed text-sky-950">
                  <p className="font-bold">Mode Admin Lokal</p>
                  <p className="mt-1">
                    Menyimpan akun admin lokal di peramban ini. Gunakan{' '}
                    <strong>Masuk dengan Google Admin</strong> di atas jika ingin perubahan tersinkron otomatis ke semua perangkat dan situs.
                  </p>
                </div>
              )}

            {!isStatic && !configured && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-950">
                <p className="font-bold">Aktivasi Pertama Kali</p>
                <p className="mt-1">
                  Tentukan username dan password admin untuk mengunci akses mode
                  admin di sesi ini. Untuk konfigurasi permanen saat publikasi,
                  tambahkan <code className="font-mono">ADMIN_USERNAME</code>{' '}
                  dan <code className="font-mono">ADMIN_PASSWORD</code> di{' '}
                  <strong>Settings → Secrets</strong>.
                </p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-[#B91C1C]"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-auth-username"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Username Admin
              </label>
              <input
                id="admin-auth-username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={64}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-auth-password"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Password Admin
              </label>
              <div className="relative flex items-center">
                <input
                  id="admin-auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={configured ? 'current-password' : 'new-password'}
                  required
                  minLength={configured ? 1 : 8}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="h-10 w-full rounded-md border border-slate-300 pr-10 pl-3 text-sm focus:border-[#0F2342] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {!configured && (
              <div>
                <label
                  htmlFor="admin-auth-confirm"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Konfirmasi Password
                </label>
                <input
                  id="admin-auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password admin"
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-200 pt-4">
              {isStatic && configured ? (
                <button
                  type="button"
                  onClick={handleResetStaticAdmin}
                  className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#B91C1C]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Atur Ulang Akun Lokal</span>
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || googleSubmitting}
                  className="inline-flex h-10 items-center rounded-md bg-[#0F2342] px-5 text-xs font-bold text-white hover:bg-[#173360] disabled:opacity-60"
                >
                  {submitting
                    ? 'Memverifikasi...'
                    : configured
                      ? 'Masuk Mode Admin'
                      : 'Aktifkan Mode Admin'}
                </button>
              </div>
            </div>
          </form>
          </div>
        )}
      </div>
    </div>
  );
}
