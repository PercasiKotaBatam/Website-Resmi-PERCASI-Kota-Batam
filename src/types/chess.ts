export type NavSection =
  | 'beranda'
  | 'berita'
  | 'keanggotaan'
  | 'turnamen'
  | 'peringkat'
  | 'tentang';

export type TitleCode =
  | 'GM'
  | 'IM'
  | 'FM'
  | 'WFM'
  | 'NM'
  | 'MP'
  | 'AGM'
  | 'AIM'
  | 'AFM'
  | 'ACM'
  | 'Non-Gelar';

export type CoachTitleCode =
  | 'FST'
  | 'FT'
  | 'FI'
  | 'NI'
  | 'DI'
  | 'PN'
  | 'PNM'
  | 'PNP';

export type ArbiterTitleCode =
  | 'IA'
  | 'FA'
  | 'NA'
  | 'WN'
  | 'WNM'
  | 'WNP';

export type AthleteCategory =
  | 'Senior Putra'
  | 'Senior Putri'
  | 'Junior U-18'
  | 'Junior U-14'
  | 'Veteran';

export type BatamDistrict =
  | 'Batam Kota'
  | 'Sekupang'
  | 'Lubuk Baja'
  | 'Batu Aji'
  | 'Bengkong'
  | 'Nongsa'
  | 'Sungai Beduk'
  | 'Sagulung';

export type KepriCity =
  | 'Anambas'
  | 'Bintan'
  | 'Karimun'
  | 'Kota Batam'
  | 'Lingga'
  | 'Natuna'
  | 'Tanjung Pinang';

export type RatingCategory = 'standard' | 'rapid' | 'blitz';

export interface AthleteTournamentRecord {
  tournamentName: string;
  date: string;
  category: string;
  rank: number;
  points: number;
  totalRounds: number;
  ratingChange: number;
}

export interface Athlete {
  id: string;
  fullName: string;
  title: TitleCode;
  coachTitle?: CoachTitleCode;
  arbiterTitle?: ArbiterTitleCode;
  category: AthleteCategory;
  gender: 'Putra' | 'Putri';
  birthDate?: string;
  birthYear?: number;
  club: string;
  city?: KepriCity;
  district: BatamDistrict | '-';
  photoUrl?: string;
  ratings: {
    standard: number;
    rapid: number;
    blitz: number;
  };
  bio: string;
  federationStatus: 'Atlet' | 'Aktif' | 'Pembinaan Daerah';
  tournamentHistory: AthleteTournamentRecord[];
}

export type TournamentStatus = 'Akan Datang' | 'Sedang Berlangsung' | 'Selesai';
export type TimeControlCategory = 'Standard' | 'Catur Cepat' | 'Rapid' | 'Blitz';

export interface StandingEntry {
  rank: number;
  sNo?: number;
  title: TitleCode | string;
  name: string;
  club: string;
  rating?: number | string;
  fed?: string;
  category?: string;
  points: number;
  pointsDisplay?: string;
  de?: number;
  res?: number;
  buchholz: number;
  bhDisplay?: string;
  sb?: number | string;
  ps?: number | string;
  ratingChange: number;
  percasiId?: string;
}

export interface RoundPairing {
  round: number;
  board: number;
  whiteSeed?: number;
  whiteName: string;
  whiteTitle?: string;
  whitePoints?: number | string;
  blackSeed?: number;
  blackName: string;
  blackTitle?: string;
  blackPoints?: number | string;
  result: '1-0' | '0-1' | '½-½' | '*' | string;
}

export interface InitialRankEntry {
  sNo: number;
  name: string;
  gender?: 'Putra' | 'Putri' | string;
  nationalRating?: number | string;
  internationalRating?: number | string;
  fed?: string;
  clubCity?: string;
  rating?: number | string;
  category?: string;
  title?: TitleCode | string;
  club?: string;
}

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  venue: string;
  timeControlCategory: TimeControlCategory;
  timeControlDetail: string;
  rounds: number;
  chiefArbiter: string;
  organizer: string;
  participantsCount: number;
  description: string;
  initialRankings?: InitialRankEntry[];
  standings: StandingEntry[];
  pairings: RoundPairing[];
}

export type NewsCategory = 'Turnamen' | 'Pembinaan' | 'Pengumuman Resmi';

export interface NewsArticle {
  id: string;
  title: string;
  category: NewsCategory;
  publishedAt: string;
  author: string;
  excerpt: string;
  content: string[];
  imageUrl: string;
  featured?: boolean;
}

export interface PortalData {
  version: string;
  updatedAt: string;
  athletes: Athlete[];
  tournaments: Tournament[];
  news: NewsArticle[];
}
