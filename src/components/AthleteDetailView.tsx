import { ArrowLeft, Calendar, Edit3, MapPin, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Athlete } from '../types/chess';
import {
  buildAthleteDetailProfile,
  formatRatingDelta,
  type ColorWdlStats,
} from '../utils/portalLogic';
import type { Tournament } from '../types/chess';
import { AthleteAvatar } from './AthleteAvatar';
import { TitleBadge } from './TitleBadge';

interface AthleteDetailViewProps {
  athleteIdentifier: string;
  athletes: Athlete[];
  tournaments: Tournament[];
  isAdminMode: boolean;
  backLabel: string;
  onBack: () => void;
  onSelectAthlete: (identifier: string) => void;
  onEditMember: (athlete: Athlete) => void;
  onSelectTournament: (tournamentId: string) => void;
}

function ColorBreakdownPanel({
  label,
  isWhite,
  stats,
}: {
  label: string;
  isWhite: boolean;
  stats: ColorWdlStats;
}) {
  const winPct = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
  const drawPct = stats.games > 0 ? (stats.draws / stats.games) * 100 : 0;
  const lossPct = stats.games > 0 ? (stats.losses / stats.games) * 100 : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`inline-block h-4 w-4 rounded-xs border ${
              isWhite
                ? 'border-slate-400 bg-white'
                : 'border-slate-900 bg-[#0F2342]'
            }`}
          />
          <h3 className="text-base font-bold text-[#0F2342]">{label}</h3>
        </div>
        <p className="font-mono-tabular text-xs font-semibold text-slate-600">
          {stats.games} Game · Skor {stats.points} ({stats.scoreRate}%)
        </p>
      </div>

      {/* Proportion Bar */}
      <div
        className="mt-4 flex h-2.5 w-full overflow-hidden rounded-xs bg-slate-100"
        aria-label={`Distribusi hasil ${label}: ${stats.wins} menang, ${stats.draws} remis, ${stats.losses} kalah`}
      >
        {stats.games > 0 && (
          <>
            {winPct > 0 && (
              <div
                style={{ width: `${winPct}%` }}
                className="bg-emerald-600"
              />
            )}
            {drawPct > 0 && (
              <div
                style={{ width: `${drawPct}%` }}
                className="bg-slate-400"
              />
            )}
            {lossPct > 0 && (
              <div
                style={{ width: `${lossPct}%` }}
                className="bg-[#B91C1C]"
              />
            )}
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-4 divide-x divide-slate-200 border-t border-slate-100 pt-4 text-center">
        <div>
          <p className="text-[11px] font-medium text-slate-500">Game</p>
          <p className="font-mono-tabular mt-1 text-xl font-extrabold text-[#0F2342]">
            {stats.games}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">Menang</p>
          <p className="font-mono-tabular mt-1 text-xl font-extrabold text-emerald-700">
            {stats.wins}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">Remis</p>
          <p className="font-mono-tabular mt-1 text-xl font-extrabold text-slate-500">
            {stats.draws}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500">Kalah</p>
          <p className="font-mono-tabular mt-1 text-xl font-extrabold text-[#B91C1C]">
            {stats.losses}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AthleteDetailView({
  athleteIdentifier,
  athletes,
  tournaments,
  isAdminMode,
  backLabel,
  onBack,
  onSelectAthlete,
  onEditMember,
  onSelectTournament,
}: AthleteDetailViewProps) {
  const [colorFilter, setColorFilter] = useState<'Semua' | 'Putih' | 'Hitam'>('Semua');

  const profile = useMemo(
    () => buildAthleteDetailProfile(athleteIdentifier, athletes, tournaments),
    [athleteIdentifier, athletes, tournaments]
  );

  const filteredMatches = useMemo(() => {
    if (colorFilter === 'Semua') return profile.matches;
    return profile.matches.filter((m) => m.color === colorFilter);
  }, [profile.matches, colorFilter]);

  const whiteMatchesCount = useMemo(
    () => profile.matches.filter((m) => m.color === 'Putih').length,
    [profile.matches]
  );
  const blackMatchesCount = useMemo(
    () => profile.matches.filter((m) => m.color === 'Hitam').length,
    [profile.matches]
  );

  const totalPct = (count: number) =>
    profile.totalStats.games > 0
      ? `${Math.round((count / profile.totalStats.games) * 1000) / 10}%`
      : '0%';

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-xs font-bold text-[#0F2342] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center gap-3">
          {isAdminMode && profile.registeredAthlete && (
            <button
              type="button"
              onClick={() => onEditMember(profile.registeredAthlete!)}
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white transition-colors hover:bg-[#173360] whitespace-nowrap shrink-0"
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Profil Atlet</span>
            </button>
          )}
        </div>
      </div>

      {/* Athlete Identity Header */}
      <section
        aria-labelledby="athlete-detail-heading"
        className="rounded-lg border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AthleteAvatar
              name={profile.fullName}
              photoUrl={profile.photoUrl}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <TitleBadge title={profile.title} />
                <span className="font-semibold text-slate-700">
                  {profile.category}
                </span>
                {profile.federationStatus && (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {profile.federationStatus}
                  </span>
                )}
                {profile.fed && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="font-mono-tabular font-semibold">
                      FED {profile.fed}
                    </span>
                  </>
                )}
              </div>

              <h1
                id="athlete-detail-heading"
                className="mt-2 text-2xl font-extrabold tracking-tight text-[#0F2342] sm:text-3xl"
              >
                {profile.fullName}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>
                    {profile.club !== '-'
                      ? `${profile.club}${profile.district ? ` · Kec. ${profile.district}, Kota Batam` : ''}`
                      : profile.district
                        ? `Kec. ${profile.district}, Kota Batam`
                        : 'Kota Batam'}
                  </span>
                </span>
                {profile.birthYear && (
                  <span className="font-mono-tabular">
                    Tahun Lahir:{' '}
                    <strong className="text-slate-900">{profile.birthYear}</strong>
                  </span>
                )}
                {profile.seedNumber !== undefined && (
                  <span className="font-mono-tabular">
                    Seed Turnamen:{' '}
                    <strong className="text-slate-900">#{profile.seedNumber}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ratings Summary */}
          {profile.ratings ? (
            <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 bg-slate-50 py-3.5 text-center lg:w-80 shrink-0">
              <div className="px-3">
                <p className="text-[11px] font-semibold text-slate-500">Standard</p>
                <p className="font-mono-tabular mt-1 text-xl font-extrabold text-[#0F2342]">
                  {profile.ratings.standard > 0 ? profile.ratings.standard : '-'}
                </p>
              </div>
              <div className="px-3">
                <p className="text-[11px] font-semibold text-slate-500">Rapid</p>
                <p className="font-mono-tabular mt-1 text-xl font-extrabold text-[#0F2342]">
                  {profile.ratings.rapid > 0 ? profile.ratings.rapid : '-'}
                </p>
              </div>
              <div className="px-3">
                <p className="text-[11px] font-semibold text-slate-500">Blitz</p>
                <p className="font-mono-tabular mt-1 text-xl font-extrabold text-[#0F2342]">
                  {profile.ratings.blitz > 0 ? profile.ratings.blitz : '-'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-md border border-slate-200 bg-slate-50 py-3.5 text-center lg:w-64 shrink-0">
              <div className="px-4">
                <p className="text-[11px] font-semibold text-slate-500">
                  Rating Turnamen
                </p>
                <p className="font-mono-tabular mt-1 text-xl font-extrabold text-[#0F2342]">
                  {profile.tournamentRating ?? '-'}
                </p>
              </div>
              <div className="px-4">
                <p className="text-[11px] font-semibold text-slate-500">
                  Skor Total
                </p>
                <p className="font-mono-tabular mt-1 text-xl font-extrabold text-[#0F2342]">
                  {profile.totalStats.points}
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
          {profile.bio}
        </p>
      </section>

      {/* Main Statistics: Total & Color Breakdown */}
      <section aria-labelledby="athlete-stats-heading" className="space-y-5">
        <div className="border-b border-slate-200 pb-3">
          <h2
            id="athlete-stats-heading"
            className="text-xl font-bold tracking-tight text-[#0F2342]"
          >
            Statistik Pertandingan &amp; Performa Warna Buah
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Jumlah game yang dimainkan sebagai buah Putih maupun Hitam serta
            rincian total menang, remis, dan kalah.
          </p>
        </div>

        {/* 4-column Total KPI Strip */}
        <div
          data-testid="total-stats-strip"
          className="grid grid-cols-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0"
        >
          <div className="p-5">
            <p className="text-xs font-semibold text-slate-500">
              Total Game Dimainkan
            </p>
            <p className="font-mono-tabular mt-1.5 text-3xl font-extrabold text-[#0F2342]">
              {profile.totalStats.games}
            </p>
            <p className="font-mono-tabular mt-1 text-xs text-slate-500">
              Putih {profile.whiteStats.games} · Hitam {profile.blackStats.games}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-semibold text-slate-500">Total Menang</p>
            <p className="font-mono-tabular mt-1.5 text-3xl font-extrabold text-emerald-700">
              {profile.totalStats.wins}
            </p>
            <p className="font-mono-tabular mt-1 text-xs text-slate-500">
              {totalPct(profile.totalStats.wins)} dari total game
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-semibold text-slate-500">Total Remis</p>
            <p className="font-mono-tabular mt-1.5 text-3xl font-extrabold text-slate-500">
              {profile.totalStats.draws}
            </p>
            <p className="font-mono-tabular mt-1 text-xs text-slate-500">
              {totalPct(profile.totalStats.draws)} dari total game
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-semibold text-slate-500">Total Kalah</p>
            <p className="font-mono-tabular mt-1.5 text-3xl font-extrabold text-[#B91C1C]">
              {profile.totalStats.losses}
            </p>
            <p className="font-mono-tabular mt-1 text-xs text-slate-500">
              {totalPct(profile.totalStats.losses)} dari total game
            </p>
          </div>
        </div>

        {/* White vs Black Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ColorBreakdownPanel
            label="Sebagai Buah Putih"
            isWhite
            stats={profile.whiteStats}
          />
          <ColorBreakdownPanel
            label="Sebagai Buah Hitam"
            isWhite={false}
            stats={profile.blackStats}
          />
        </div>

        {/* Summary Matrix Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase">
                  <th scope="col" className="px-4 py-3">
                    Kategori Buah
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Jumlah Game
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Menang
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Remis
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Kalah
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Total Poin
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Skor (%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-3.5 w-3.5 rounded-xs border border-slate-400 bg-white"
                      />
                      <span>Buah Putih</span>
                    </span>
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-bold text-[#0F2342]">
                    {profile.whiteStats.games}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-semibold text-emerald-700">
                    {profile.whiteStats.wins}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-semibold text-slate-500">
                    {profile.whiteStats.draws}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-semibold text-[#B91C1C]">
                    {profile.whiteStats.losses}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-bold text-slate-900">
                    {profile.whiteStats.points}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right text-slate-700">
                    {profile.whiteStats.scoreRate}%
                  </td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-3.5 w-3.5 rounded-xs border border-slate-900 bg-[#0F2342]"
                      />
                      <span>Buah Hitam</span>
                    </span>
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-bold text-[#0F2342]">
                    {profile.blackStats.games}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-semibold text-emerald-700">
                    {profile.blackStats.wins}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-semibold text-slate-500">
                    {profile.blackStats.draws}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-semibold text-[#B91C1C]">
                    {profile.blackStats.losses}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right font-bold text-slate-900">
                    {profile.blackStats.points}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right text-slate-700">
                    {profile.blackStats.scoreRate}%
                  </td>
                </tr>

                <tr className="bg-slate-50/70 font-bold">
                  <td className="px-4 py-3 text-[#0F2342]">Total Keseluruhan</td>
                  <td className="font-mono-tabular px-4 py-3 text-right text-[#0F2342]">
                    {profile.totalStats.games}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right text-emerald-700">
                    {profile.totalStats.wins}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right text-slate-500">
                    {profile.totalStats.draws}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right text-[#B91C1C]">
                    {profile.totalStats.losses}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right text-[#0F2342]">
                    {profile.totalStats.points}
                  </td>
                  <td className="font-mono-tabular px-4 py-3 text-right text-[#0F2342]">
                    {profile.totalStats.scoreRate}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Match-by-Match History */}
      <section aria-labelledby="athlete-matches-heading" className="space-y-4">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-end">
          <div>
            <h2
              id="athlete-matches-heading"
              className="text-xl font-bold tracking-tight text-[#0F2342]"
            >
              Riwayat Pertandingan per Babak
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Klik nama lawan untuk membuka halaman statistik atlet tersebut.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter warna buah pertandingan"
            className="inline-flex rounded-md bg-slate-100 p-1"
          >
            {(
              [
                { id: 'Semua', label: `Semua (${profile.matches.length})` },
                { id: 'Putih', label: `Putih (${whiteMatchesCount})` },
                { id: 'Hitam', label: `Hitam (${blackMatchesCount})` },
              ] as const
            ).map((tab) => {
              const active = colorFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setColorFilter(tab.id)}
                  className={`h-9 rounded px-3 text-xs font-bold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#0F2342] text-white'
                      : 'text-slate-700 hover:text-[#0F2342]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Belum ada catatan partai babak per babak untuk filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase">
                    <th scope="col" className="px-4 py-3">
                      Turnamen
                    </th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">
                      Babak &amp; Meja
                    </th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">
                      Warna Buah
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Lawan
                    </th>
                    <th scope="col" className="px-4 py-3 text-center whitespace-nowrap">
                      Hasil
                    </th>
                    <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatches.map((m, idx) => {
                    const outcomeColor =
                      m.outcome === 'Menang'
                        ? 'text-emerald-700'
                        : m.outcome === 'Remis'
                          ? 'text-slate-500'
                          : m.outcome === 'Kalah'
                            ? 'text-[#B91C1C]'
                            : 'text-slate-500';
                    return (
                      <tr
                        key={`${m.tournamentId}-${m.round}-${m.board}-${idx}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSelectTournament(m.tournamentId)}
                            className="text-left font-semibold text-[#0F2342] hover:underline"
                          >
                            {m.tournamentName}
                          </button>
                          <p className="text-[11px] text-slate-500">
                            {m.timeControlCategory}
                          </p>
                        </td>
                        <td className="font-mono-tabular px-4 py-3 text-slate-700 whitespace-nowrap">
                          Babak {m.round} · Meja {m.board}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                            <span
                              aria-hidden="true"
                              className={`inline-block h-3.5 w-3.5 rounded-xs border ${
                                m.color === 'Putih'
                                  ? 'border-slate-400 bg-white'
                                  : 'border-slate-900 bg-[#0F2342]'
                              }`}
                            />
                            <span>{m.color}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSelectAthlete(m.opponentName)}
                            className="text-left font-semibold text-slate-900 hover:text-[#0F2342] hover:underline"
                          >
                            {m.opponentName}
                          </button>
                          {m.opponentSeed !== undefined && (
                            <span className="font-mono-tabular ml-1.5 text-[11px] text-slate-400">
                              (No. {m.opponentSeed})
                            </span>
                          )}
                        </td>
                        <td className="font-mono-tabular px-4 py-3 text-center font-bold text-[#0F2342] whitespace-nowrap">
                          {m.result === '*' ? 'Berlangsung' : m.result}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold whitespace-nowrap ${outcomeColor}`}
                        >
                          {m.outcome}
                          {m.isForfeit ? ' (WO)' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Tournament Standings & Archived History */}
      {(profile.standingsRecords.length > 0 ||
        (profile.registeredAthlete?.tournamentHistory.length ?? 0) > 0) && (
        <section
          aria-labelledby="athlete-standings-heading"
          className="space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <h2
              id="athlete-standings-heading"
              className="text-xl font-bold tracking-tight text-[#0F2342]"
            >
              Catatan Klasemen &amp; Arsip Turnamen
            </h2>
          </div>

          {profile.standingsRecords.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 uppercase">
                      <th scope="col" className="px-4 py-3">
                        Turnamen
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Tanggal
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Peringkat
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Poin
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        BH
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        SB
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        PS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profile.standingsRecords.map((rec) => (
                      <tr key={rec.tournamentId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-[#0F2342]">
                          <button
                            type="button"
                            onClick={() => onSelectTournament(rec.tournamentId)}
                            className="text-left hover:underline"
                          >
                            {rec.tournamentName}
                          </button>
                          <span className="ml-1.5 font-normal text-slate-500">
                            ({rec.timeControlCategory})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar
                              className="h-3.5 w-3.5 text-slate-400"
                              aria-hidden="true"
                            />
                            <span>{rec.date}</span>
                          </span>
                        </td>
                        <td className="font-mono-tabular px-4 py-3 text-right font-bold text-[#0F2342]">
                          #{rec.rank} / {rec.totalParticipants}
                        </td>
                        <td className="font-mono-tabular px-4 py-3 text-right font-extrabold text-[#0F2342]">
                          {rec.pointsDisplay}
                        </td>
                        <td className="font-mono-tabular px-4 py-3 text-right text-slate-700">
                          {rec.bhDisplay ?? '-'}
                        </td>
                        <td className="font-mono-tabular px-4 py-3 text-right text-slate-700">
                          {rec.sb ?? '-'}
                        </td>
                        <td className="font-mono-tabular px-4 py-3 text-right text-slate-700">
                          {rec.ps ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {profile.registeredAthlete &&
            profile.registeredAthlete.tournamentHistory.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 uppercase">
                  Arsip Catatan Rating Federasi
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <th scope="col" className="px-4 py-2.5">
                          Turnamen
                        </th>
                        <th scope="col" className="px-4 py-2.5">
                          Tanggal
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right">
                          Peringkat
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right">
                          Poin
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right">
                          +/- Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profile.registeredAthlete.tournamentHistory.map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {rec.tournamentName}{' '}
                            <span className="font-normal text-slate-500">
                              ({rec.category})
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                            {rec.date}
                          </td>
                          <td className="font-mono-tabular px-4 py-2.5 text-right font-bold text-[#0F2342]">
                            #{rec.rank}
                          </td>
                          <td className="font-mono-tabular px-4 py-2.5 text-right font-semibold text-slate-800">
                            {rec.points}/{rec.totalRounds}
                          </td>
                          <td
                            className={`font-mono-tabular px-4 py-2.5 text-right font-bold ${
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
              </div>
            )}
        </section>
      )}
    </div>
  );
}
