import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import type { NavSection } from '../types/chess';
import { PercasiLogo } from './PercasiLogo';

interface FooterProps {
  onNavigate: (section: NavSection) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-[#09172E] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-xs">
                <PercasiLogo className="h-full w-full" />
              </div>
              <div>
                <p className="text-base font-bold text-white">
                  PERCASI Kota Batam
                </p>
                <p className="text-xs text-slate-400">
                  Persatuan Catur Seluruh Indonesia — Pengurus Kota Batam
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              Portal resmi pengelolaan basis data atlet, daftar peringkat daerah
              (Standard, Rapid, dan Blitz), berita pembinaan, serta publikasi
              hasil turnamen catur resmi di wilayah Kota Batam, Kepulauan Riau.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Navigasi Portal</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="#beranda"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('beranda');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Beranda
                </a>
              </li>
              <li>
                <a
                  href="#keanggotaan"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('keanggotaan');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Keanggotaan &amp; Atlet
                </a>
              </li>
              <li>
                <a
                  href="#turnamen"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('turnamen');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Turnamen &amp; Hasil
                </a>
              </li>
              <li>
                <a
                  href="#peringkat"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('peringkat');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Daftar Peringkat
                </a>
              </li>
              <li>
                <a
                  href="#tentang"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('tentang');
                  }}
                  className="hover:text-white transition-colors"
                >
                  Tentang Pengkot Batam
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">Sekretariat &amp; Tautan</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span>
                  Jalan Laksamana Bintan Komplek Ruko Inti Blok H No. 3 Sei Panas
                  Batam Kota - Kota Batam
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span>percasikotabatam01@gmail.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span className="font-mono-tabular">+62 822-8846-3999</span>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-800 pt-4 text-xs font-semibold">
              <a
                href="https://www.pb-percasi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-white hover:text-amber-300"
              >
                <span>PB PERCASI</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="https://www.fide.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-white hover:text-amber-300"
              >
                <span>FIDE International</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>
            © 2026 Pengurus Kota PERCASI Batam. Seluruh hak cipta dilindungi.
          </p>
          <p>Afiliasi Resmi KONI Kota Batam · Pengprov PERCASI Kepulauan Riau</p>
        </div>
      </div>
    </footer>
  );
}
