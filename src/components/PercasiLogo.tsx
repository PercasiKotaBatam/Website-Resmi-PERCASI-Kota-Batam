import percasiLogoImg from '../assets/images/logo_percasi_batam.png';

interface PercasiLogoProps {
  className?: string;
}

export function PercasiLogo({ className = 'w-9 h-9' }: PercasiLogoProps) {
  return (
    <img
      src={percasiLogoImg}
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
    />
  );
}
