import { useState } from 'react';
import { getInitials } from '../utils/portalLogic';

interface AthleteAvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-10 h-10 text-xs',
  md: 'w-14 h-14 text-sm',
  lg: 'w-28 h-28 text-2xl',
};

export function AthleteAvatar({
  name,
  photoUrl,
  size = 'md',
  className = '',
}: AthleteAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(name);

  if (photoUrl && !imgFailed) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 ${SIZE_CLASSES[size]} ${className}`}
      >
        <img
          src={photoUrl}
          alt={`Foto resmi atlet catur ${name}`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={`Inisial atlet ${name}`}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-gradient-to-br from-[#0F2342] to-[#1E3A6D] font-bold tracking-wider text-white ${SIZE_CLASSES[size]} ${className}`}
    >
      <span className="select-none">{initials}</span>
    </div>
  );
}
