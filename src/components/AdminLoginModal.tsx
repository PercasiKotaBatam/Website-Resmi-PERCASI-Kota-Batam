import { Eye, EyeOff, KeyRound, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, username: string) => void;
}

interface AdminStatusResponse {
  configured: boolean;
  source: 'env' | 'claimed' | 'unconfigured';
}

export function AdminLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setStatusLoading(true);

    fetch('/api/admin/status')
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal memeriksa status autentikasi admin.');
        return (await res.json()) as AdminStatusResponse;
      })
      .then((data) => {
        if (!cancelled) {
          setConfigured(Boolean(data.configured));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfigured(true);
          setError('Tidak dapat terhubung ke layanan autentikasi admin.');
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
      const endpoint = configured ? '/api/admin/login' : '/api/admin/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

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
      setError('Terjadi kesalahan jaringan saat memverifikasi akun admin.');
    } finally {
      setSubmitting(false);
    }
  };

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
        className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl"
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
                {configured ? 'Masuk Mode Admin' : 'Aktivasi Akun Admin'}
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
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {!configured && (
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

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center rounded-md bg-[#0F2342] px-5 text-xs font-bold text-white hover:bg-[#173360] disabled:opacity-60"
              >
                {submitting
                  ? 'Memverifikasi...'
                  : configured
                    ? 'Masuk Mode Admin'
                    : 'Aktifkan Mode Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
