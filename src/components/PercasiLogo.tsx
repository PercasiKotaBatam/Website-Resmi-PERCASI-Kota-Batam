import { resolvePublicAssetUrl } from '../utils/portalLogic';

interface PercasiLogoProps {
  className?: string;
}

export function PercasiLogo({ className = 'w-9 h-9' }: PercasiLogoProps) {
  return (
    <img
      src={resolvePublicAssetUrl('assets/aistudio/Logo_Percasi_Kota_Batam_f72a3db5.png')}
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
    />
  );
}
