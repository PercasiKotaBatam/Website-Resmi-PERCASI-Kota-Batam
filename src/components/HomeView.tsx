import { ArrowRight, Calendar, MapPin, Search, Trophy, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import heroOfficialPhoto from '../assets/images/hero_percasi_batam_official.jpg';
import type {
  Athlete,
  NavSection,
  NewsArticle,
  RatingCategory,
  Tournament,
} from '../types/chess';
import { getAthleteCity, getTopAthletes } from '../utils/portalLogic';
import { AthleteAvatar } from './AthleteAvatar';
import { TitleBadge, TournamentStatusText } from './TitleBadge';

interface HomeViewProps {
  athletes: Athlete[];
  tournaments: Tournament[];
  news: NewsArticle[];
  onNavigate: (section: NavSection) => void;
  onSelectAthlete: (athlete: Athlete) => void;
  onSelectTournament: (tournament: Tournament) => void;
  onSelectNews: (article: NewsArticle) => void;
}

const RATING_TABS: { id: RatingCategory; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'rapid', label: 'Rapid' },
  { id: 'blitz', label: 'Blitz' },
];

export function HomeView({
  athletes,
  tournaments,
  news,
  onNavigate,
  onSelectAthlete,
  onSelectTournament,
  onSelectNews,
}: HomeViewProps) {
  const [quickQuery, setQuickQuery] = useState('');
  const [topTab, setTopTab] = useState<RatingCategory>('standard');
  const [heroImgError, setHeroImgError] = useState(false);

  const topAthletes = useMemo(
    () => getTopAthletes(athletes, topTab, 5),
    [athletes, topTab]
  );

  const spotlightTournament = useMemo(
    () =>
      tournaments.find(
        (t) =>
          t.id === 'trn-darwin-cup-2026' ||
          /darwin cup 2026/i.test(t.name)
      ) ?? tournaments[0],
    [tournaments]
  );

  const quickSearchResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return null;
    const matchedAthletes = athletes
      .filter((a) =>
        [a.fullName, a.club, getAthleteCity(a), a.district !== '-' ? a.district : '']
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 4);
    const matchedTournaments = tournaments
      .filter((t) =>
        [t.name, t.venue, t.chiefArbiter].join(' ').toLowerCase().includes(q)
      )
      .slice(0, 3);
    return { matchedAthletes, matchedTournaments };
  }, [athletes, tournaments, quickQuery]);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-[#0F2342] text-white">
        <div className="mx-auto grid max-w-7xl items-stretch gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-14">
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <p className="text-xs font-semibold tracking-wider text-amber-300 uppercase">
                Portal Resmi Pengurus Kota Batam · PB PERCASI
              </p>
              <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                PERCASI Kota Batam
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200">
                Pusat informasi keanggotaan atlet, daftar peringkat daerah
                Standard, Rapid, dan Blitz, serta publikasi hasil kejuaraan
                resmi di Kota Batam, Provinsi Kepulauan Riau.
              </p>

              {/* Spotlight Kejurkot */}
              {spotlightTournament && (
                <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
                    <span className="font-semibold">Sorotan Kejuaraan</span>
                    <span>
                      {spotlightTournament.startDate === spotlightTournament.endDate
                        ? spotlightTournament.startDate
                        : `${spotlightTournament.startDate} – ${spotlightTournament.endDate}`}{' '}
                      - {spotlightTournament.venue}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-base font-bold text-white sm:text-lg">
                        {spotlightTournament.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-300">
                        {spotlightTournament.timeControlCategory}{' '}
                        {spotlightTournament.timeControlDetail}
                        {spotlightTournament.timeControlDetail
                          .toLowerCase()
                          .includes('swiss')
                          ? ''
                          : `, Sistem Swiss ${spotlightTournament.rounds} babak`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTournament(spotlightTournament)}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-white px-4 text-xs font-bold text-[#0F2342] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                    >
                      <span>
                        {spotlightTournament.standings.length > 0
                          ? 'Lihat Klasemen'
                          : 'Lihat Peringkat Awal'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Search */}
            <div className="relative mt-6">
              <label
                htmlFor="home-quick-search"
                className="mb-2 block text-xs font-semibold text-slate-300"
              >
                Pencarian Cepat Atlet atau Turnamen
              </label>
              <div className="relative flex items-center">
                <Search
                  className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="home-quick-search"
                  type="search"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Cari nama atlet, klub, kecamatan, atau turnamen..."
                  className="h-12 w-full rounded-md border border-slate-300 bg-white pr-28 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none"
                />
                {quickQuery ? (
                  <button
                    type="button"
                    onClick={() => setQuickQuery('')}
                    className="absolute right-2 rounded px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Bersihkan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('keanggotaan')}
                    className="absolute right-2 rounded bg-[#0F2342] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173360]"
                  >
                    Direktori
                  </button>
                )}
              </div>

              {quickSearchResults && (
                <div
                  role="region"
                  aria-label="Hasil pencarian cepat"
                  className="absolute right-0 left-0 z-30 mt-2 max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white p-3 text-slate-900 shadow-lg"
                >
                  {quickSearchResults.matchedAthletes.length === 0 &&
                  quickSearchResults.matchedTournaments.length === 0 ? (
                    <p className="py-3 text-center text-sm text-slate-500">
                      Tidak ditemukan atlet atau turnamen untuk kata kunci "{quickQuery}".
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {quickSearchResults.matchedAthletes.length > 0 && (
                        <div>
                          <p className="px-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            Atlet PERCASI Batam
                          </p>
                          <div className="mt-1 divide-y divide-slate-100">
                            {quickSearchResults.matchedAthletes.map((ath) => (
                              <button
                                key={ath.id}
                                type="button"
                                onClick={() => {
                                  onSelectAthlete(ath);
                                  setQuickQuery('');
                                }}
                                className="flex w-full items-center justify-between rounded px-2 py-2 text-left hover:bg-slate-50"
                              >
                                <div className="flex items-center gap-2.5">
                                  <TitleBadge title={ath.title} />
                                  <span className="text-sm font-semibold text-slate-900">
                                    {ath.fullName}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {ath.district !== '-' ? ath.district : getAthleteCity(ath)}
                                  </span>
                                </div>
                                <span className="font-mono-tabular text-xs font-bold text-[#0F2342]">
                                  {ath.ratings.standard > 0 ? `STD ${ath.ratings.standard}` : ath.federationStatus}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {quickSearchResults.matchedTournaments.length > 0 && (
                        <div>
                          <p className="px-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            Turnamen
                          </p>
                          <div className="mt-1 divide-y divide-slate-100">
                            {quickSearchResults.matchedTournaments.map((trn) => (
                              <button
                                key={trn.id}
                                type="button"
                                onClick={() => {
                                  onSelectTournament(trn);
                                  setQuickQuery('');
                                }}
                                className="flex w-full items-center justify-between rounded px-2 py-2 text-left hover:bg-slate-50"
                              >
                                <span className="text-sm font-semibold text-slate-900">
                                  {trn.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {trn.startDate}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-white/15 bg-[#09172E] lg:col-span-5">
            {!heroImgError ? (
              <img
                src={heroOfficialPhoto}
                alt="Suasana pertandingan resmi turnamen catur Pengkot PERCASI Kota Batam"
                onError={() => setHeroImgError(true)}
                className="h-64 w-full object-cover lg:h-full"
              />
            ) : (
              <div className="flex h-64 w-full flex-col items-center justify-center bg-[#09172E] p-6 text-center lg:h-full">
                <Trophy className="h-10 w-10 text-amber-400" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-white">
                  PERCASI Kota Batam 2026
                </p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4">
              <p className="text-xs font-medium text-slate-200">
                Arena Pertandingan Resmi Pengkot PERCASI Kota Batam
              </p>
            </div>
          </div>
        </div>

        {/* Operational Federation Strip (Below Hero Split) */}
        <div className="border-t border-white/10 bg-[#09172E]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
            <div className="px-4 py-3.5">
              <p className="text-[11px] font-medium text-slate-400">
                Atlet Terdaftar
              </p>
              <p className="font-mono-tabular mt-0.5 text-lg font-bold text-white">
                {athletes.length} Atlet
              </p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[11px] font-medium text-slate-400">
                Turnamen Resmi
              </p>
              <p className="font-mono-tabular mt-0.5 text-lg font-bold text-white">
                {tournaments.length} Agenda
              </p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[11px] font-medium text-slate-400">
                Rating Tertinggi (STD)
              </p>
              <p className="font-mono-tabular mt-0.5 text-lg font-bold text-amber-300">
                {Math.max(...athletes.map((a) => a.ratings.standard), 0)}
              </p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[11px] font-medium text-slate-400">
                Cakupan Wilayah
              </p>
              <p className="mt-0.5 text-lg font-bold text-white">
                8 Kecamatan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Top 5 Pecatur (+ Berita Terbaru when available) */}
      {news.length > 0 ? (
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* Berita & Pengumuman Terbaru */}
          <section className="lg:col-span-7" aria-labelledby="home-news-heading">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
              <h2
                id="home-news-heading"
                className="text-xl font-bold tracking-tight text-[#0F2342]"
              >
                Berita &amp; Pengumuman Terbaru
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('berita')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Semua Berita</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {news.slice(0, 4).map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-[#B91C1C]">
                        {item.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.publishedAt}</span>
                    </div>
                    <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">
                      <button
                        type="button"
                        onClick={() => onSelectNews(item)}
                        className="text-left hover:text-[#0F2342] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2342]"
                      >
                        {item.title}
                      </button>
                    </h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                      {item.excerpt}
                    </p>
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => onSelectNews(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2342] hover:underline"
                      >
                        <span>Baca selengkapnya</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Top 5 Pecatur Kota Batam Widget */}
          <aside className="lg:col-span-5" aria-labelledby="home-top5-heading">
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2
                      id="home-top5-heading"
                      className="text-lg font-bold tracking-tight text-[#0F2342]"
                    >
                      Top 5 Pecatur Kota Batam
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Peringkat resmi berdasarkan rating aktif Pengkot Batam
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('peringkat')}
                    className="text-xs font-semibold text-[#B91C1C] hover:underline whitespace-nowrap shrink-0"
                  >
                    Daftar Lengkap
                  </button>
                </div>

                <div
                  role="tablist"
                  aria-label="Kategori rating top 5"
                  className="mt-4 grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1"
                >
                  {RATING_TABS.map((tab) => {
                    const active = topTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setTopTab(tab.id)}
                        className={`h-9 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
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

              <div className="divide-y divide-slate-100">
                {topAthletes.map((athlete, idx) => (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => onSelectAthlete(athlete)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono-tabular w-5 shrink-0 text-sm font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <AthleteAvatar
                        name={athlete.fullName}
                        photoUrl={athlete.photoUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <TitleBadge title={athlete.title} />
                          <span className="truncate text-sm font-bold text-slate-900">
                            {athlete.fullName}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {athlete.club} ·{' '}
                          {athlete.district !== '-'
                            ? athlete.district
                            : getAthleteCity(athlete)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-tabular text-base font-extrabold text-[#0F2342]">
                        {athlete.ratings[topTab] > 0 ? athlete.ratings[topTab] : '-'}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {athlete.federationStatus}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Membership Link Panel */}
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F2342]">
                    Direktori Keanggotaan &amp; Klub Batam
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Telusuri profil lengkap atlet senior, junior, dan veteran
                    dari 8 kecamatan di Kota Batam beserta riwayat pertandingan.
                  </p>
                </div>
                <Users className="h-6 w-6 shrink-0 text-[#0F2342]" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => onNavigate('keanggotaan')}
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-md border border-[#0F2342] px-4 text-xs font-bold text-[#0F2342] transition-colors hover:bg-[#0F2342] hover:text-white"
              >
                <span>Buka Direktori Anggota</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <section className="lg:col-span-7" aria-labelledby="home-top5-heading">
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2
                      id="home-top5-heading"
                      className="text-lg font-bold tracking-tight text-[#0F2342]"
                    >
                      Top 5 Pecatur Kota Batam
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Peringkat resmi berdasarkan rating aktif Pengkot Batam
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('peringkat')}
                    className="text-xs font-semibold text-[#B91C1C] hover:underline whitespace-nowrap shrink-0"
                  >
                    Daftar Lengkap
                  </button>
                </div>

                <div
                  role="tablist"
                  aria-label="Kategori rating top 5"
                  className="mt-4 grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1"
                >
                  {RATING_TABS.map((tab) => {
                    const active = topTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setTopTab(tab.id)}
                        className={`h-9 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
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

              <div className="divide-y divide-slate-100">
                {topAthletes.map((athlete, idx) => (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => onSelectAthlete(athlete)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono-tabular w-5 shrink-0 text-sm font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <AthleteAvatar
                        name={athlete.fullName}
                        photoUrl={athlete.photoUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <TitleBadge title={athlete.title} />
                          <span className="truncate text-sm font-bold text-slate-900">
                            {athlete.fullName}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {athlete.club} ·{' '}
                          {athlete.district !== '-'
                            ? athlete.district
                            : getAthleteCity(athlete)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-tabular text-base font-extrabold text-[#0F2342]">
                        {athlete.ratings[topTab] > 0 ? athlete.ratings[topTab] : '-'}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {athlete.federationStatus}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5" aria-labelledby="home-tournaments-heading">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
              <h2
                id="home-tournaments-heading"
                className="text-xl font-bold tracking-tight text-[#0F2342]"
              >
                Jadwal &amp; Hasil Turnamen Kota Batam
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('turnamen')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C] hover:underline whitespace-nowrap shrink-0"
              >
                <span>Semua Turnamen</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {tournaments.slice(0, 3).map((trn) => (
                <article
                  key={trn.id}
                  className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <TournamentStatusText status={trn.status} />
                      <span className="font-mono-tabular text-xs font-semibold text-slate-500">
                        {trn.timeControlCategory} · {trn.rounds} Babak
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-bold leading-snug text-slate-900">
                      {trn.name}
                    </h3>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>
                          {trn.startDate === trn.endDate
                            ? trn.startDate
                            : `${trn.startDate} – ${trn.endDate}`}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>{trn.venue}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">
                      Wasit: {trn.chiefArbiter}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectTournament(trn)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0F2342] hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>Detail Hasil</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F2342]">
                    Direktori Keanggotaan &amp; Klub Batam
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Telusuri profil lengkap atlet senior, junior, dan veteran
                    dari 8 kecamatan di Kota Batam beserta riwayat pertandingan.
                  </p>
                </div>
                <Users className="h-6 w-6 shrink-0 text-[#0F2342]" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => onNavigate('keanggotaan')}
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-md border border-[#0F2342] px-4 text-xs font-bold text-[#0F2342] transition-colors hover:bg-[#0F2342] hover:text-white"
              >
                <span>Buka Direktori Anggota</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Jadwal & Hasil Turnamen Summary (only rendered below when news is present) */}
      {news.length > 0 && (
        <section
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
          aria-labelledby="home-tournaments-heading"
        >
          <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
            <h2
              id="home-tournaments-heading"
              className="text-xl font-bold tracking-tight text-[#0F2342]"
            >
              Jadwal &amp; Hasil Turnamen Kota Batam
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('turnamen')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Semua Turnamen</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {tournaments.slice(0, 3).map((trn) => (
              <article
                key={trn.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <TournamentStatusText status={trn.status} />
                    <span className="font-mono-tabular text-xs font-semibold text-slate-500">
                      {trn.timeControlCategory} · {trn.rounds} Babak
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold leading-snug text-slate-900">
                    {trn.name}
                  </h3>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <span>
                        {trn.startDate} – {trn.endDate}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <span>{trn.venue}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">
                    Wasit: {trn.chiefArbiter}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectTournament(trn)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0F2342] hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>Detail Hasil</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
