import type {
  ArbiterTitleCode,
  CoachTitleCode,
  TitleCode,
  TournamentStatus,
} from '../types/chess';

const COACH_CODES = new Set(['FST', 'FT', 'FI', 'NI', 'DI', 'PN', 'PNM', 'PNP']);
const ARBITER_CODES = new Set(['IA', 'FA', 'NA', 'WN', 'WNM', 'WNP']);

interface TitleBadgeProps {
  title: TitleCode | CoachTitleCode | ArbiterTitleCode | string;
  variant?: 'player' | 'coach' | 'arbiter';
}

export function TitleBadge({ title, variant }: TitleBadgeProps) {
  if (!title || title === 'Non-Gelar') {
    return (
      <span className="inline-block font-mono-tabular text-[11px] font-medium text-slate-500 whitespace-nowrap">
        Non-Gelar
      </span>
    );
  }

  const resolvedVariant =
    variant ??
    (COACH_CODES.has(title)
      ? 'coach'
      : ARBITER_CODES.has(title)
        ? 'arbiter'
        : 'player');

  const isFideMaster = title === 'GM' || title === 'IM' || title === 'FM' || title === 'WFM';
  const styleClass =
    resolvedVariant === 'coach'
      ? 'bg-teal-50 text-teal-900 border-teal-300'
      : resolvedVariant === 'arbiter'
        ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
        : isFideMaster
          ? 'bg-[#0F2342] text-white border-[#0F2342]'
          : title === 'NM'
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : 'bg-slate-100 text-slate-800 border-slate-300';

  const roleLabel =
    resolvedVariant === 'coach'
      ? `Pelatih ${title}`
      : resolvedVariant === 'arbiter'
        ? `Wasit ${title}`
        : undefined;

  return (
    <span
      title={roleLabel}
      className={`inline-flex items-center justify-center rounded-sm border px-1.5 py-0.5 font-mono-tabular text-[11px] font-bold tracking-wide whitespace-nowrap ${styleClass}`}
    >
      {title}
    </span>
  );
}

interface StatusMarkerProps {
  status: TournamentStatus;
}

export function TournamentStatusText({ status }: StatusMarkerProps) {
  const colorClass =
    status === 'Sedang Berlangsung'
      ? 'text-[#B91C1C] bg-red-50 border-red-200'
      : status === 'Akan Datang'
        ? 'text-amber-800 bg-amber-50 border-amber-200'
        : 'text-slate-700 bg-slate-100 border-slate-200';

  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${colorClass}`}
    >
      {status}
    </span>
  );
}
