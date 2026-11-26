import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { NewsArticle } from '../types/chess';

interface NewsDetailModalProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export function NewsDetailModal({ article, onClose }: NewsDetailModalProps) {
  useEffect(() => {
    if (!article) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-[#B91C1C]">{article.category}</span>
            <span aria-hidden="true">·</span>
            <span>{article.publishedAt}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Tutup artikel ${article.title}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <h2
            id="news-modal-title"
            className="text-balance text-2xl font-extrabold leading-snug text-[#0F2342]"
          >
            {article.title}
          </h2>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Oleh: {article.author}
          </p>

          <div className="mt-5 aspect-[16/10] w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            <img
              src={article.imageUrl}
              alt={article.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-6 max-w-prose space-y-4 text-base leading-relaxed text-slate-700">
            {article.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
