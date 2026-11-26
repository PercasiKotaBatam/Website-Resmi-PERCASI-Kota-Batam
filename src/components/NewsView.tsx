import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import type { NewsArticle, NewsCategory } from '../types/chess';

interface NewsViewProps {
  news: NewsArticle[];
  onSelectNews: (article: NewsArticle) => void;
}

const CATEGORIES: (NewsCategory | 'Semua')[] = [
  'Semua',
  'Turnamen',
  'Pembinaan',
  'Pengumuman Resmi',
];

export function NewsView({ news, onSelectNews }: NewsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'Semua'>('Semua');

  const filtered =
    selectedCategory === 'Semua'
      ? news
      : news.filter((item) => item.category === selectedCategory);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#B91C1C] uppercase">
            Publikasi Resmi
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0F2342] sm:text-3xl">
            Berita &amp; Pengumuman PERCASI Batam
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Liputan kejuaraan daerah, agenda pembinaan atlet junior, dan surat
            keputusan resmi pengurus kota.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filter kategori berita"
          className="flex flex-wrap gap-1.5 rounded-md bg-slate-100 p-1"
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                className={`h-9 rounded px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#0F2342] text-white'
                    : 'text-slate-700 hover:text-[#0F2342]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-lg border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {news.length === 0
              ? 'Belum ada berita atau pengumuman yang dipublikasikan.'
              : `Belum ada berita untuk kategori ${selectedCategory}.`}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {filtered.map((item) => (
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
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#B91C1C]">
                    {item.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.publishedAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.author}</span>
                </div>
                <h2 className="mt-2 text-xl font-bold leading-snug text-slate-900">
                  <button
                    type="button"
                    onClick={() => onSelectNews(item)}
                    className="text-left hover:text-[#0F2342] hover:underline"
                  >
                    {item.title}
                  </button>
                </h2>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600">
                  {item.excerpt}
                </p>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => onSelectNews(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F2342] hover:underline"
                  >
                    <span>Baca Artikel Lengkap</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
