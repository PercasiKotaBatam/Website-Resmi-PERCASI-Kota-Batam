import { Edit3, MapPin, Trophy, X } from 'lucide-react';
import { useEffect } from 'react';
import type { Athlete } from '../types/chess';
import { formatRatingDelta } from '../utils/portalLogic';
import { AthleteAvatar } from './AthleteAvatar';
import { TitleBadge } from './TitleBadge';

interface AthleteProfileModalProps {
  athlete: Athlete | null;
  isAdminMode: boolean;
  onClose: () => void;
  onEdit: (athlete: Athlete) => void;
}

export function AthleteProfileModal({
  athlete,
  isAdminMode,
  onClose,
  onEdit,
}: AthleteProfileModalProps) {
  useEffect(() => {
    if (!athlete) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [athlete, onClose]);

  if (!athlete) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="athlete-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <span className="font-mono-tabular text-xs font-semibold text-slate-500">
            Kartu Profil Atlet · {athlete.percasiId}
          </span>
          <div className="flex items-center gap-2">
            {isAdminMode && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(athlete);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit Profil</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={`Tutup profil ${athlete.fullName}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Header Bio */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AthleteAvatar
              name={athlete.fullName}
              photoUrl={athlete.photoUrl}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <TitleBadge title={athlete.title} />
                <span className="text-xs font-semibold text-slate-600">
                  {athlete.category}
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="text-xs text-slate-500">
                  {athlete.federationStatus}
                </span>
              </div>

              <h2
                id="athlete-modal-title"
                className="mt-1.5 text-2xl font-extrabold text-[#0F2342]"
              >
                {athlete.fullName}
              </h2>

              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>
                    {athlete.club} · Kecamatan {athlete.district}, Kota Batam
                  </span>
                </p>
                <p className="font-mono-tabular">
                  ID PERCASI: <strong className="text-slate-900">{athlete.percasiId}</strong>
                  {athlete.fideId ? (
                    <>
                      {' '}
                      · FIDE ID: <strong className="text-slate-900">{athlete.fideId}</strong>
                    </>
                  ) : null}{' '}
                  · Tahun Lahir: <strong className="text-slate-900">{athlete.birthYear}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Ratings Breakdown */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50 py-4 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-500">Standard</p>
              <p className="font-mono-tabular mt-1 text-2xl font-extrabold text-[#0F2342]">
                {athlete.ratings.standard}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Rapid</p>
              <p className="font-mono-tabular mt-1 text-2xl font-extrabold text-[#0F2342]">
                {athlete.ratings.rapid}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Blitz</p>
              <p className="font-mono-tabular mt-1 text-2xl font-extrabold text-[#0F2342]">
                {athlete.ratings.blitz}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <h3 className="text-sm font-bold text-[#0F2342]">
              Catatan &amp; Profil Singkat
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {athlete.bio || 'Atlet resmi terdaftar di Pengkot PERCASI Kota Batam.'}
            </p>
          </div>

          {/* Tournament History */}
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-[#0F2342]">
                Riwayat Pertandingan Terbaru
              </h3>
            </div>

            {athlete.tournamentHistory.length === 0 ? (
              <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Belum ada catatan turnamen yang diarsipkan pada periode ini.
              </p>
            ) : (
              <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                      <th scope="col" className="px-3 py-2.5">
                        Turnamen
                      </th>
                      <th scope="col" className="px-3 py-2.5">
                        Tanggal
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        Peringkat
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        Poin
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        +/- Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {athlete.tournamentHistory.map((rec, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">
                          {rec.tournamentName}
                          <span className="ml-1.5 font-normal text-slate-500">
                            ({rec.category})
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                          {rec.date}
                        </td>
                        <td className="font-mono-tabular px-3 py-2.5 text-right font-bold text-[#0F2342]">
                          #{rec.rank}
                        </td>
                        <td className="font-mono-tabular px-3 py-2.5 text-right font-semibold text-slate-800">
                          {rec.points}/{rec.totalRounds}
                        </td>
                        <td
                          className={`font-mono-tabular px-3 py-2.5 text-right font-bold ${
                            rec.ratingChange > 0
                              ? 'text-emerald-700'
                              : rec.ratingChange < 0
                                ? 'text-[#B91C1C]'
                                : 'text-slate-500'
                          }`}
                        >
                          {formatRatingDelta(rec.ratingChange)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
