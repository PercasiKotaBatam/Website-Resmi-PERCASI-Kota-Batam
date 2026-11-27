import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  Athlete,
  AthleteCategory,
  BatamDistrict,
  TitleCode,
} from '../types/chess';
import {
  CATEGORY_OPTIONS,
  DISTRICT_OPTIONS,
  TITLE_OPTIONS,
  calculateAthleteAge,
} from '../utils/portalLogic';
import { compressImageToBase64 } from '../utils/storage';
import { AthleteAvatar } from './AthleteAvatar';

interface MemberFormModalProps {
  isOpen: boolean;
  editingAthlete: Athlete | null;
  onClose: () => void;
  onSave: (athlete: Athlete, isEdit: boolean) => void;
}

export function MemberFormModal({
  isOpen,
  editingAthlete,
  onClose,
  onSave,
}: MemberFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState<TitleCode>('Non-Gelar');
  const [category, setCategory] = useState<AthleteCategory>('Senior Putra');
  const [gender, setGender] = useState<'Putra' | 'Putri'>('Putra');
  const [birthDate, setBirthDate] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [club, setClub] = useState('');
  const [district, setDistrict] = useState<BatamDistrict>('Batam Kota');
  const [standard, setStandard] = useState('1600');
  const [rapid, setRapid] = useState('1600');
  const [blitz, setBlitz] = useState('1600');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingAthlete) {
      setFullName(editingAthlete.fullName);
      setTitle(editingAthlete.title);
      setCategory(editingAthlete.category);
      setGender(editingAthlete.gender);
      setBirthDate(editingAthlete.birthDate ?? '');
      setBirthYear(editingAthlete.birthYear ? String(editingAthlete.birthYear) : '');
      setClub(editingAthlete.club);
      setDistrict(editingAthlete.district);
      setStandard(String(editingAthlete.ratings.standard));
      setRapid(String(editingAthlete.ratings.rapid));
      setBlitz(String(editingAthlete.ratings.blitz));
      setBio(editingAthlete.bio);
      setPhotoUrl(editingAthlete.photoUrl);
    } else {
      setFullName('');
      setTitle('Non-Gelar');
      setCategory('Senior Putra');
      setGender('Putra');
      setBirthDate('');
      setBirthYear('2001');
      setClub('Semanggi Chess Club');
      setDistrict('Batam Kota');
      setStandard('1650');
      setRapid('1650');
      setBlitz('1650');
      setBio('');
      setPhotoUrl(undefined);
    }
    setError('');
  }, [isOpen, editingAthlete]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const compressed = await compressImageToBase64(file, 360, 0.8);
      setPhotoUrl(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memproses foto profil.'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedClub = club.trim();

    if (!trimmedName) {
      setError('Nama lengkap atlet wajib diisi.');
      return;
    }
    if (!trimmedClub) {
      setError('Nama klub atau komunitas catur Batam wajib diisi.');
      return;
    }

    const trimmedBirthDate = birthDate.trim();
    if (trimmedBirthDate && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedBirthDate)) {
      setError('Format tanggal lahir tidak valid.');
      return;
    }

    const birthDateYear = trimmedBirthDate
      ? Number.parseInt(trimmedBirthDate.slice(0, 4), 10)
      : undefined;
    const trimmedBirth = birthYear.trim();
    const parsedBirth =
      birthDateYear ?? (trimmedBirth ? Number.parseInt(trimmedBirth, 10) : undefined);
    const parsedStd = Number.parseInt(standard, 10);
    const parsedRpd = Number.parseInt(rapid, 10);
    const parsedBlz = Number.parseInt(blitz, 10);

    if (
      parsedBirth !== undefined &&
      (Number.isNaN(parsedBirth) || parsedBirth < 1935 || parsedBirth > 2022)
    ) {
      setError('Tahun/tanggal lahir tidak valid (1935–2022).');
      return;
    }

    const isValidRating = (r: number) => !Number.isNaN(r) && (r === 0 || (r >= 800 && r <= 2900));
    if (![parsedStd, parsedRpd, parsedBlz].every(isValidRating)) {
      setError('Nilai rating Standard, Rapid, dan Blitz harus 0 (non-rating) atau antara 800–2900.');
      return;
    }

    const payload: Athlete = {
      id: editingAthlete?.id ?? `ath-${Date.now()}`,
      fullName: trimmedName,
      title,
      category,
      gender,
      ...(trimmedBirthDate ? { birthDate: trimmedBirthDate } : {}),
      ...(parsedBirth !== undefined ? { birthYear: parsedBirth } : {}),
      club: trimmedClub,
      district,
      photoUrl,
      ratings: {
        standard: parsedStd,
        rapid: parsedRpd,
        blitz: parsedBlz,
      },
      bio:
        bio.trim() ||
        `Atlet catur terdaftar Pengkot PERCASI Kota Batam wilayah ${district}.`,
      federationStatus: 'Atlet',
      tournamentHistory: editingAthlete?.tournamentHistory ?? [],
    };

    onSave(payload, Boolean(editingAthlete));
    onClose();
  };

  const previewBirthYear = birthYear.trim()
    ? Number.parseInt(birthYear.trim(), 10)
    : undefined;
  const previewAge = calculateAthleteAge(
    birthDate.trim() || undefined,
    previewBirthYear && !Number.isNaN(previewBirthYear) ? previewBirthYear : undefined
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-form-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2
            id="member-form-title"
            className="text-lg font-extrabold text-[#0F2342]"
          >
            {editingAthlete
              ? `Edit Data Anggota: ${editingAthlete.fullName}`
              : 'Tambah Anggota PERCASI Batam Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir anggota"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-[#B91C1C]"
            >
              {error}
            </div>
          )}

          {/* Photo Upload & Preview */}
          <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <AthleteAvatar
              name={fullName || 'Atlet Baru'}
              photoUrl={photoUrl}
              size="lg"
            />
            <div className="flex-1">
              <label
                htmlFor="member-photo-upload"
                className="block text-xs font-bold text-slate-800"
              >
                Foto Profil Resmi (Otomatis Dikompresi)
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Format JPG/PNG. Gambar dikompresi otomatis di peramban agar
                ringan disimpan di localStorage.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label
                  htmlFor="member-photo-upload"
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {uploadingPhoto ? 'Memproses...' : 'Pilih Foto'}
                  </span>
                </label>
                <input
                  id="member-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(undefined)}
                    className="inline-flex h-9 items-center rounded-md px-2.5 text-xs font-semibold text-[#B91C1C] hover:bg-red-50"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="member-fullname"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nama Lengkap *
              </label>
              <input
                id="member-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Aditya Pratama"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="member-title"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Gelar Catur
              </label>
              <select
                id="member-title"
                value={title}
                onChange={(e) => setTitle(e.target.value as TitleCode)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              >
                {TITLE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="member-category"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kategori Atlet
              </label>
              <select
                id="member-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as AthleteCategory)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="member-gender"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Putra / Putri
              </label>
              <select
                id="member-gender"
                value={gender}
                onChange={(e) =>
                  setGender(e.target.value as 'Putra' | 'Putri')
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              >
                <option value="Putra">Putra</option>
                <option value="Putri">Putri</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="member-birthdate"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tanggal Lahir{' '}
                {previewAge !== null && (
                  <span className="font-normal text-slate-500">
                    (Umur: {previewAge} tahun)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="member-birthdate"
                  type="date"
                  min="1935-01-01"
                  max="2022-12-31"
                  value={birthDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBirthDate(val);
                    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      setBirthYear(val.slice(0, 4));
                    }
                  }}
                  className="font-mono-tabular h-10 w-full rounded-md border border-slate-300 px-2.5 text-xs focus:border-[#0F2342] focus:outline-none sm:text-sm"
                />
                <input
                  id="member-birthyear"
                  type="number"
                  min={1935}
                  max={2022}
                  aria-label="Tahun Lahir"
                  placeholder="Tahun"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="font-mono-tabular h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="member-club"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Klub Catur *
              </label>
              <input
                id="member-club"
                type="text"
                required
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="Contoh: Semanggi Chess Club"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="member-district"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kecamatan di Batam
              </label>
              <select
                id="member-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value as BatamDistrict)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              >
                {DISTRICT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ratings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="member-std"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Rating Standard
              </label>
              <input
                id="member-std"
                type="number"
                min={0}
                max={2900}
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="font-mono-tabular h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="member-rpd"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Rating Rapid
              </label>
              <input
                id="member-rpd"
                type="number"
                min={0}
                max={2900}
                value={rapid}
                onChange={(e) => setRapid(e.target.value)}
                className="font-mono-tabular h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="member-blz"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Rating Blitz
              </label>
              <input
                id="member-blz"
                type="number"
                min={0}
                max={2900}
                value={blitz}
                onChange={(e) => setBlitz(e.target.value)}
                className="font-mono-tabular h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#0F2342] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="member-bio"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Biografi Singkat / Catatan Prestasi
            </label>
            <textarea
              id="member-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ringkasan spesialisasi pembukaan atau prestasi tingkat kota/provinsi..."
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
              {editingAthlete ? 'Simpan Perubahan' : 'Daftarkan Anggota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
