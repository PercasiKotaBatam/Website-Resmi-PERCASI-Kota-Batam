import { Building2, ExternalLink, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { DISTRICT_OPTIONS } from '../utils/portalLogic';

const ADVISORY_GROUPS = [
  {
    title: 'Pelindung',
    members: ['Walikota', 'Wakil Walikota', 'Kapolres', 'Ketua DPRD', 'Dandim'],
  },
  {
    title: 'Dewan Penasehat',
    members: [
      'Suhandri, S.Pd., MP, PNP',
      'Kombes Pol Drg. Muhammad Zakir',
      'Letkol Laut Irwan Manalu',
    ],
  },
  {
    title: 'Dewan Pertimbangan',
    members: ['Dohn Fredi Siregar', 'Abdul Hakim'],
  },
];

const EXECUTIVE_BOARD = [
  { role: 'Ketua', name: 'Niko Nixon Situmorang, S.H., M.H.' },
  { role: 'Ketua Harian', name: 'Edison Saragih' },
  { role: 'Wakil Ketua 1', name: 'Sahat Sitanggang, MN, PNP' },
  { role: 'Wakil Ketua 2', name: 'Agusta Slamet' },
  { role: 'Sekretaris', name: 'Muh Baihaqi' },
  { role: 'Wakil Sekretaris 1', name: 'William Weekhai, AIM, DI, WNP' },
  { role: 'Wakil Sekretaris', name: 'Yurika F. Angelia' },
  { role: 'Bendahara', name: 'Endi Dariyusman' },
  { role: 'Wakil Bendahara', name: 'Dendra Sitohang' },
];

const DIVISION_COORDINATORS = [
  {
    division: 'Hubungan Masyarakat',
    members: ['Fahrizal', 'Juminto'],
  },
  {
    division: 'Komisi Disiplin',
    members: ['Pandapotan Panjaitan'],
  },
  {
    division: 'Pembinaan dan Prestasi',
    members: ['Junny Purnama Khoh, S.Ak., AWP', 'Fachrizal'],
  },
  {
    division: 'Atlet Disabilitas',
    members: ['Fahrizal'],
  },
  {
    division: 'Kajian Pengembangan',
    members: ['Abdi Lisani Firdaus', 'Slamet Sugiarto', 'Ismail Yudi'],
  },
  {
    division: 'Kesehatan',
    members: ['Atlantika, S. Keb', 'Queen Agave Siregar, S. Keb, Ns.'],
  },
  {
    division: 'Pertandingan dan Wasit',
    members: ['Aldriyanto Syarif, WNM, PNP', 'Paraden Pakpahan, WNM', 'Henny Ginting, WNP'],
  },
  {
    division: 'Sarana Perlengkapan',
    members: ['Rizky Ritonga', 'Jon Toni', 'Mae Timbul'],
  },
];

export function AboutView() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold tracking-wider text-[#B91C1C] uppercase">
          Profil Organisasi
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0F2342] sm:text-3xl">
          Tentang PERCASI Kota Batam
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Persatuan Catur Seluruh Indonesia (PERCASI) Pengurus Kota Batam
          merupakan induk organisasi olahraga catur resmi di bawah naungan
          Pengprov PERCASI Kepulauan Riau, PB PERCASI, dan KONI Kota Batam.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-[#0F2342]">
              Visi &amp; Mandat Pembinaan
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                PERCASI Kota Batam berkomitmen membangun ekosistem olahraga catur
                yang profesional, transparan, dan berbasis data peringkat
                terukur di seluruh kecamatan Kota Batam.
              </p>
              <p>
                Melalui penyelenggaraan Kejuaraan Kota (Kejurkot), sirkuit
                kelompok umur U-14 dan U-18, serta standardisasi perwasitan
                nasional dan FIDE, kami mencetak atlet-atlet berprestasi yang
                siap bersaing di tingkat provinsi, nasional, hingga
                internasional.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0F2342]">
                Susunan Pengurus Periode 2026-2030
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Lampiran SK Pengprov PERCASI Kepulauan Riau Nomor: 002/PERCASI-KEPRI/SK/VII/2026
                (21 Juli 2026)
              </p>
            </div>

            <div className="mt-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {ADVISORY_GROUPS.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5"
                  >
                    <h3 className="text-xs font-bold tracking-wider text-[#B91C1C] uppercase">
                      {group.title}
                    </h3>
                    <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-800">
                      {group.members.map((member) => (
                        <li key={member} className="leading-relaxed">
                          {member}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#0F2342] uppercase">
                  Badan Pengurus
                </h3>
                <div className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {EXECUTIVE_BOARD.map((item) => (
                    <div
                      key={item.role}
                      className="flex flex-col justify-between gap-0.5 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <span className="text-xs font-semibold text-slate-500">
                        {item.role}
                      </span>
                      <span className="text-sm font-bold text-slate-900 sm:text-right">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#0F2342] uppercase">
                  Koordinator Bidang
                </h3>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {DIVISION_COORDINATORS.map((item) => (
                    <div
                      key={item.division}
                      className="rounded-md border border-slate-200 bg-white px-4 py-3"
                    >
                      <p className="text-xs font-bold text-[#0F2342]">
                        {item.division}
                      </p>
                      <ul className="mt-1.5 space-y-0.5 text-xs text-slate-700">
                        {item.members.map((member) => (
                          <li key={member} className="font-medium">
                            {member}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-[#0F2342]">
              Jaringan Klub &amp; Kecamatan Kota Batam
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Pembinaan klub catur aktif tersebar di delapan wilayah kecamatan
              Kota Batam:
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DISTRICT_OPTIONS.map((district) => (
                <div
                  key={district}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-[#0F2342]" aria-hidden="true" />
                  <span>{district}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <section className="rounded-lg border border-slate-200 bg-[#0F2342] p-6 text-white">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-amber-400" aria-hidden="true" />
              <h2 className="text-lg font-bold">Sekretariat Pengkot Batam</h2>
            </div>
            <ul className="mt-5 space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span>
                  Jalan Laksamana Bintan Komplek Ruko Inti Blok H No. 3 Sei Panas
                  Batam Kota - Kota Batam
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span>percasikotabatam01@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span className="font-mono-tabular">+62 822-8846-3999</span>
              </li>
            </ul>
            <p className="mt-5 border-t border-white/15 pt-4 text-xs text-slate-300">
              Jam Layanan Sekretariat: Senin – Jumat, 09.00 – 16.30 WIB
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-[#0F2342]">
              Afiliasi &amp; Tautan Resmi Federasi
            </h2>
            <div className="mt-4 space-y-3">
              <a
                href="https://www.pb-percasi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-slate-200 p-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#0F2342] hover:bg-slate-50"
              >
                <div>
                  <p className="text-[#0F2342]">PB PERCASI Pusat</p>
                  <p className="text-xs font-normal text-slate-500">
                    Pengurus Besar Persatuan Catur Seluruh Indonesia
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </a>

              <a
                href="https://www.fide.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-slate-200 p-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#0F2342] hover:bg-slate-50"
              >
                <div>
                  <p className="text-[#0F2342]">FIDE (World Chess Federation)</p>
                  <p className="text-xs font-normal text-slate-500">
                    Basis data rating internasional &amp; regulasi resmi FIDE
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
