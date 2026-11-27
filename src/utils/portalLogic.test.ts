import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  buildAthleteDetailProfile,
  buildInitialRankings,
  evaluatePairingOutcome,
  filterAthletes,
  filterPairingsByRound,
  formatRatingDelta,
  generateSampleCsvTemplate,
  generateSampleExcelBytes,
  generateSamplePairingsExcelBytes,
  getInitials,
  mergeRoundPairings,
  normalizeAthleteName,
  parsePairingsCsv,
  parsePairingsExcelBuffer,
  parseStandingsCsv,
  parseStandingsExcelBuffer,
  parseStandingsJson,
  pickAuthoritativePortalData,
  resolvePublicAssetUrl,
  sortRatings,
  validatePortalBackup,
} from './portalLogic';
import {
  DARWIN_CUP_INITIAL_RANKINGS,
  FIRDAUS_CUP_INITIAL_RANKINGS,
  FIRDAUS_CUP_ROUND_1_PAIRINGS,
  FIRDAUS_CUP_ROUND_2_PAIRINGS,
  FIRDAUS_CUP_ROUND_3_PAIRINGS,
  FIRDAUS_CUP_ROUND_4_PAIRINGS,
  FIRDAUS_CUP_ROUND_5_PAIRINGS,
  FIRDAUS_CUP_ROUND_6_PAIRINGS,
  FIRDAUS_CUP_ROUND_7_PAIRINGS,
  FIRDAUS_CUP_STANDINGS,
  HERO_IMAGE_URL,
  SEED_ATHLETES,
  SEED_NEWS,
  SEED_PORTAL_DATA,
  SEED_TOURNAMENTS,
} from '../data/seedData';
import { migratePortalData } from './storage';
import type { Athlete } from '../types/chess';

const SAMPLE_ATHLETES: Athlete[] = [
  {
    id: 'a1',
    fullName: 'Godfrid Harry Mollyson Siregar',
    title: 'NM',
    category: 'Senior Putra',
    gender: 'Putra',
    birthYear: 1990,
    club: 'Semanggi Chess Club',
    district: 'Sagulung',
    ratings: { standard: 2131, rapid: 2243, blitz: 2125 },
    bio: 'National Master Batam.',
    federationStatus: 'Atlet',
    tournamentHistory: [],
  },
  {
    id: 'a2',
    fullName: 'Suhandri',
    title: 'MP',
    category: 'Senior Putra',
    gender: 'Putra',
    birthYear: 1992,
    club: '-',
    district: 'Nongsa',
    ratings: { standard: 1992, rapid: 1992, blitz: 1992 },
    bio: 'PERCASI Master Batam.',
    federationStatus: 'Atlet',
    tournamentHistory: [],
  },
  {
    id: 'a3',
    fullName: "Lu'Lu'Ul Ilmi",
    title: 'Non-Gelar',
    category: 'Senior Putri',
    gender: 'Putri',
    birthYear: 2004,
    club: 'Sagulung Chess Community',
    district: 'Sagulung',
    ratings: { standard: 1618, rapid: 1618, blitz: 1618 },
    bio: 'Atlet putri Batam.',
    federationStatus: 'Atlet',
    tournamentHistory: [],
  },
];

test('filterAthletes filters by title, category, district, and search query', () => {
  assert.equal(filterAthletes(SAMPLE_ATHLETES, { title: 'NM' }).length, 1);
  assert.equal(filterAthletes(SAMPLE_ATHLETES, { category: 'Senior Putri' }).length, 1);
  assert.equal(filterAthletes(SAMPLE_ATHLETES, { district: 'Nongsa' }).length, 1);
  assert.equal(filterAthletes(SAMPLE_ATHLETES, { query: 'nongsa' })[0]?.id, 'a2');
  assert.equal(filterAthletes(SAMPLE_ATHLETES, { query: 'godfrid' })[0]?.id, 'a1');
});

test('sortRatings orders athletes accurately by rating and name', () => {
  const byRapidDesc = sortRatings(SAMPLE_ATHLETES, 'rapid', 'rating', 'desc');
  assert.deepEqual(
    byRapidDesc.map((a) => a.id),
    ['a1', 'a2', 'a3']
  );

  const byNameAsc = sortRatings(SAMPLE_ATHLETES, 'standard', 'name', 'asc');
  assert.deepEqual(
    byNameAsc.map((a) => a.id),
    ['a1', 'a3', 'a2']
  );
});

test('parseStandingsCsv parses sample template and semicolon Swiss-Manager CSV', () => {
  const templateCsv = generateSampleCsvTemplate();
  const parsed = parseStandingsCsv(templateCsv);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.standings.length, 6);
  assert.equal(parsed.standings[0].name, 'Godfrid Harry Mollyson Siregar');
  assert.equal(parsed.standings[0].points, 6.5);
  assert.equal(parsed.standings[0].buchholz, 31.5);
  assert.equal(parsed.standings[4].ratingChange, 6);

  const semiCsv = [
    'Rk;Title;Name;Club;Pts;TB1;Chg',
    '1;NM;Nurdin Simanjuntak;Lubuk Baja;6,0;28,5;+10',
    '2;NM;Sahat Sitanggang;Batu Aji;5,5;27,0;-4',
  ].join('\n');
  const parsedSemi = parseStandingsCsv(semiCsv);
  assert.equal(parsedSemi.errors.length, 0);
  assert.equal(parsedSemi.standings.length, 2);
  assert.equal(parsedSemi.standings[0].points, 6);
  assert.equal(parsedSemi.standings[1].ratingChange, -4);
});

test('parseStandingsCsv rejects empty input and missing player names', () => {
  const emptyResult = parseStandingsCsv('   ');
  assert.equal(emptyResult.standings.length, 0);
  assert.ok(emptyResult.errors.length > 0);

  const missingName = parseStandingsCsv('Peringkat,Gelar,Nama,Klub,Poin\n1,NM,,Sagulung,5.0');
  assert.equal(missingName.standings.length, 0);
  assert.ok(missingName.errors[0].includes('Nama pemain wajib diisi'));
});

test('parseStandingsJson parses array or wrapped standings object', () => {
  const jsonInput = JSON.stringify({
    standings: [
      { rank: 2, title: 'MP', name: 'Suhandri', club: 'Nongsa', points: 4.5, buchholz: 24 },
      { rank: 1, title: 'NM', name: 'Godfrid Harry Mollyson Siregar', club: 'Semanggi Chess Club', points: 6, buchholz: 30 },
    ],
  });
  const result = parseStandingsJson(jsonInput);
  assert.equal(result.errors.length, 0);
  assert.equal(result.standings[0].rank, 1);
  assert.equal(result.standings[0].name, 'Godfrid Harry Mollyson Siregar');
});

test('validatePortalBackup validates structure and rejects invalid JSON', () => {
  const invalid = validatePortalBackup('{"athletes": []}');
  assert.equal(invalid.valid, false);

  const valid = validatePortalBackup(
    JSON.stringify({
      version: '2.0',
      updatedAt: '2026-11-01T00:00:00Z',
      athletes: SAMPLE_ATHLETES,
      tournaments: [],
      news: [],
    })
  );
  assert.equal(valid.valid, true);
  assert.equal(valid.data?.athletes.length, 3);
});

test('formatting helpers return expected strings', () => {
  assert.equal(formatRatingDelta(12), '+12');
  assert.equal(formatRatingDelta(-5), '-5');
  assert.equal(formatRatingDelta(0), '0');
  assert.equal(getInitials('Godfrid Harry Mollyson Siregar'), 'GS');
});

test('Firdaus Cup 2026 seed contains complete 46-board Round 1 through 7 pairings', () => {
  assert.equal(FIRDAUS_CUP_ROUND_1_PAIRINGS.length, 46);
  assert.equal(FIRDAUS_CUP_ROUND_2_PAIRINGS.length, 46);
  assert.equal(FIRDAUS_CUP_ROUND_3_PAIRINGS.length, 46);
  assert.equal(FIRDAUS_CUP_ROUND_4_PAIRINGS.length, 46);
  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS.length, 46);
  assert.equal(FIRDAUS_CUP_ROUND_6_PAIRINGS.length, 46);
  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS.length, 46);

  const firdaus = SEED_TOURNAMENTS.find((t) => t.id === 'trn-kejurkot-2026');
  assert.ok(firdaus);
  assert.equal(firdaus.name, 'Firdaus Cup 2026');
  assert.equal(firdaus.pairings.length, 322);

  assert.equal(FIRDAUS_CUP_ROUND_3_PAIRINGS[0]?.whiteName, 'Suhandri, PM');
  assert.equal(FIRDAUS_CUP_ROUND_3_PAIRINGS[0]?.blackName, 'Denis Liu');
  assert.equal(FIRDAUS_CUP_ROUND_3_PAIRINGS[9]?.result, '½ - ½');
  assert.equal(FIRDAUS_CUP_ROUND_3_PAIRINGS[35]?.blackPoints, '½');
  assert.equal(FIRDAUS_CUP_ROUND_3_PAIRINGS[45]?.result, '0F - 0F');
  assert.equal(FIRDAUS_CUP_ROUND_3_PAIRINGS[45]?.blackSeed, 91);

  assert.equal(FIRDAUS_CUP_ROUND_4_PAIRINGS[0]?.whiteName, 'Rico Yuliansyah');
  assert.equal(FIRDAUS_CUP_ROUND_4_PAIRINGS[0]?.blackName, 'Suhandri, PM');
  assert.equal(FIRDAUS_CUP_ROUND_4_PAIRINGS[0]?.result, '½ - ½');
  assert.equal(FIRDAUS_CUP_ROUND_4_PAIRINGS[21]?.whitePoints, '1½');
  assert.equal(FIRDAUS_CUP_ROUND_4_PAIRINGS[39]?.whitePoints, '½');
  assert.equal(FIRDAUS_CUP_ROUND_4_PAIRINGS[45]?.result, '0F - 1F');
  assert.equal(FIRDAUS_CUP_ROUND_4_PAIRINGS[45]?.blackSeed, 31);

  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS[0]?.whiteName, 'Jon Toni');
  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS[0]?.blackName, 'Jonathan Charmian Vivaldy');
  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS[0]?.result, '0 - 1');
  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS[2]?.result, '½ - ½');
  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS[12]?.blackName, 'Godfrid Harry Mollyson Siregar, NM');
  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS[41]?.whitePoints, '½');
  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS[45]?.result, '0F - 0F');
  assert.equal(FIRDAUS_CUP_ROUND_5_PAIRINGS[45]?.blackSeed, 37);

  assert.equal(FIRDAUS_CUP_ROUND_6_PAIRINGS[0]?.whiteName, 'Jonathan Charmian Vivaldy');
  assert.equal(FIRDAUS_CUP_ROUND_6_PAIRINGS[0]?.blackName, 'Suhandri, PM');
  assert.equal(FIRDAUS_CUP_ROUND_6_PAIRINGS[0]?.result, '0 - 1');
  assert.equal(FIRDAUS_CUP_ROUND_6_PAIRINGS[22]?.blackName, 'Ismail Yudi');
  assert.equal(FIRDAUS_CUP_ROUND_6_PAIRINGS[37]?.result, '½ - ½');
  assert.equal(FIRDAUS_CUP_ROUND_6_PAIRINGS[45]?.result, '0F - 0F');
  assert.equal(FIRDAUS_CUP_ROUND_6_PAIRINGS[45]?.blackSeed, 91);

  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS[0]?.whiteName, 'Suhandri, PM');
  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS[0]?.whitePoints, '5½');
  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS[0]?.blackName, 'Sahat Sitanggang, NM');
  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS[0]?.result, '1 - 0');
  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS[2]?.result, '½ - ½');
  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS[37]?.result, '½ - ½');
  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS[45]?.result, '0F - 0F');
  assert.equal(FIRDAUS_CUP_ROUND_7_PAIRINGS[45]?.blackSeed, 91);

  assert.equal(FIRDAUS_CUP_STANDINGS.length, 92);
  assert.equal(firdaus.standings.length, 92);
  assert.equal(new Set(FIRDAUS_CUP_STANDINGS.map((s) => s.sNo)).size, 92);
  assert.equal(FIRDAUS_CUP_STANDINGS[0]?.name, 'Suhandri, PM');
  assert.equal(FIRDAUS_CUP_STANDINGS[0]?.pointsDisplay, '6½');
  assert.equal(FIRDAUS_CUP_STANDINGS[0]?.sb, '29,5');
  assert.equal(FIRDAUS_CUP_STANDINGS[22]?.name, 'Godfrid Harry Mollyson Siregar, NM');
  assert.equal(FIRDAUS_CUP_STANDINGS[22]?.rating, 2243);
  assert.equal(FIRDAUS_CUP_STANDINGS[43]?.sNo, 23);
  assert.equal(FIRDAUS_CUP_STANDINGS[43]?.name, 'Aprizal');
  assert.equal(FIRDAUS_CUP_STANDINGS[44]?.rank, 44);
  assert.equal(FIRDAUS_CUP_STANDINGS[44]?.name, 'Rafel Risker');
  assert.equal(FIRDAUS_CUP_STANDINGS[84]?.category, 'Putri');
  assert.equal(FIRDAUS_CUP_STANDINGS[84]?.name, 'Agus Winarsih');
  assert.equal(FIRDAUS_CUP_STANDINGS[91]?.rank, 90);
  assert.equal(FIRDAUS_CUP_STANDINGS[91]?.sNo, 72);
  assert.equal(FIRDAUS_CUP_STANDINGS[91]?.name, 'Rahadani');
});

test('normalizeAthleteName and evaluatePairingOutcome handle titles, aliases, and forfeits', () => {
  assert.equal(normalizeAthleteName('Suhandri, PM'), 'suhandri');
  assert.equal(normalizeAthleteName('Godfrid Harry Mollyson Siregar, NM'), 'godfrid harry mollyson siregar');
  assert.equal(normalizeAthleteName('Isma Yudi'), 'ismail yudi');

  assert.deepEqual(evaluatePairingOutcome('1 - 0', 'Putih'), { outcome: 'Menang', isForfeit: false });
  assert.deepEqual(evaluatePairingOutcome('1 - 0', 'Hitam'), { outcome: 'Kalah', isForfeit: false });
  assert.deepEqual(evaluatePairingOutcome('½ - ½', 'Putih'), { outcome: 'Remis', isForfeit: false });
  assert.deepEqual(evaluatePairingOutcome('0F - 1F', 'Hitam'), { outcome: 'Menang', isForfeit: true });
  assert.deepEqual(evaluatePairingOutcome('0F - 0F', 'Putih'), { outcome: 'Kalah', isForfeit: true });
  assert.deepEqual(evaluatePairingOutcome('*', 'Putih'), { outcome: 'Berlangsung', isForfeit: false });
});

test('buildAthleteDetailProfile computes White, Black, and Total W/D/L stats accurately', () => {
  const suhandri = buildAthleteDetailProfile('ath-04', SEED_ATHLETES, SEED_TOURNAMENTS);
  assert.equal(suhandri.fullName, 'Suhandri');
  assert.equal(suhandri.whiteStats.games, 4);
  assert.equal(suhandri.whiteStats.wins, 4);
  assert.equal(suhandri.whiteStats.draws, 0);
  assert.equal(suhandri.whiteStats.losses, 0);
  assert.equal(suhandri.blackStats.games, 3);
  assert.equal(suhandri.blackStats.wins, 2);
  assert.equal(suhandri.blackStats.draws, 1);
  assert.equal(suhandri.blackStats.losses, 0);
  assert.equal(suhandri.totalStats.games, 7);
  assert.equal(suhandri.totalStats.wins, 6);
  assert.equal(suhandri.totalStats.draws, 1);
  assert.equal(suhandri.totalStats.losses, 0);
  assert.equal(suhandri.totalStats.points, 6.5);
  assert.equal(suhandri.ongoingGames, 0);
  assert.equal(suhandri.matches.length, 7);
  assert.equal(suhandri.matches.every((m) => m.outcome !== 'Berlangsung'), true);
  assert.equal(suhandri.matches.some((m) => m.tournamentId === 'trn-rapid-walikota-2026'), false);
  assert.equal(suhandri.matches.every((m) => m.timeControlCategory === 'Catur Cepat'), true);
  assert.equal(suhandri.registeredAthlete?.tournamentHistory[0]?.category, 'Catur Cepat');

  const godfrid = buildAthleteDetailProfile('Godfrid Harry Mollyson Siregar, NM', SEED_ATHLETES, SEED_TOURNAMENTS);
  assert.equal(godfrid.registeredAthlete?.id, 'ath-01');
  assert.equal(godfrid.totalStats.games, 7);
  assert.equal(godfrid.whiteStats.games, 4);
  assert.equal(godfrid.whiteStats.wins, 2);
  assert.equal(godfrid.whiteStats.draws, 1);
  assert.equal(godfrid.whiteStats.losses, 1);
  assert.equal(godfrid.blackStats.games, 3);
  assert.equal(godfrid.blackStats.wins, 2);
  assert.equal(godfrid.blackStats.draws, 0);
  assert.equal(godfrid.blackStats.losses, 1);
  assert.equal(godfrid.totalStats.points, 4.5);
  assert.equal(godfrid.matches.every((m) => m.timeControlCategory === 'Catur Cepat'), true);

  const jonathan = buildAthleteDetailProfile('Jonathan Charmian Vivaldy', SEED_ATHLETES, SEED_TOURNAMENTS);
  assert.ok(jonathan.registeredAthlete);
  assert.equal(jonathan.registeredAthlete.federationStatus, 'Atlet');
  assert.equal(jonathan.tournamentRating, 1896);
  assert.equal(jonathan.totalStats.games, 7);
  assert.equal(jonathan.totalStats.points, 6);
  assert.equal(jonathan.totalStats.wins + jonathan.totalStats.draws + jonathan.totalStats.losses, 7);
  assert.equal(jonathan.matches.every((m) => m.timeControlCategory === 'Catur Cepat'), true);
  assert.equal(jonathan.standingsRecords[0]?.timeControlCategory, 'Catur Cepat');

  const ismail = buildAthleteDetailProfile('Isma Yudi', SEED_ATHLETES, SEED_TOURNAMENTS);
  assert.equal(ismail.fullName, 'Ismail Yudi');
  assert.equal(ismail.totalStats.games, 7);
  assert.equal(ismail.totalStats.points, 3);
});

test('migratePortalData purges stale duplicated pairings from cached Firdaus Cup 2026 data', () => {
  const polluted = {
    ...SEED_PORTAL_DATA,
    tournaments: SEED_PORTAL_DATA.tournaments.map((t) =>
      t.id === 'trn-kejurkot-2026'
        ? {
            ...t,
            timeControlCategory: 'Standard' as const,
            pairings: [
              ...t.pairings,
              { round: 1, board: 99, whiteName: 'Suhandri', blackName: 'Dummy 1', result: '1 - 0' },
              { round: 2, board: 99, whiteName: 'Dummy 2', blackName: 'Suhandri', result: '0 - 1' },
              { round: 6, board: 99, whiteName: 'Suhandri', blackName: 'Dummy 3', result: '1 - 0' },
            ],
          }
        : t
    ),
  };

  const cleaned = migratePortalData({
    ...polluted,
    tournaments: [
      ...polluted.tournaments,
      {
        ...polluted.tournaments[0]!,
        id: 'trn-rapid-walikota-2026',
        name: 'Batam Rapid Open — Piala Wali Kota 2026',
      },
    ],
    news: [
      {
        id: 'news-01',
        title: 'Old News',
        category: 'Turnamen',
        publishedAt: '18 Nov 2026',
        author: 'Humas',
        excerpt: '...',
        content: ['...'],
        imageUrl: '',
      },
    ],
  });
  const suhandri = buildAthleteDetailProfile('ath-04', cleaned.athletes, cleaned.tournaments);
  assert.equal(cleaned.tournaments.length, 2);
  assert.equal(cleaned.tournaments[0]?.id, 'trn-kejurkot-2026');
  assert.equal(cleaned.tournaments[1]?.id, 'trn-darwin-cup-2026');
  assert.equal(cleaned.tournaments[0]?.pairings.length, 322);
  assert.equal(cleaned.tournaments[0]?.timeControlCategory, 'Catur Cepat');
  assert.equal(cleaned.news.length, 0);
  assert.equal(suhandri.totalStats.games, 7);
  assert.equal(suhandri.whiteStats.games, 4);
  assert.equal(suhandri.whiteStats.wins, 4);
  assert.equal(suhandri.blackStats.games, 3);
  assert.equal(suhandri.blackStats.wins, 2);
  assert.equal(suhandri.blackStats.draws, 1);
  assert.equal(suhandri.blackStats.losses, 0);
});

test('Firdaus Cup 2026 and Darwin Cup 2026 exist in seed with 148-player initial rankings and zero news', () => {
  assert.equal(SEED_TOURNAMENTS.length, 2);
  assert.equal(SEED_TOURNAMENTS[0]?.id, 'trn-kejurkot-2026');
  assert.equal(SEED_TOURNAMENTS[0]?.name, 'Firdaus Cup 2026');
  assert.equal(SEED_TOURNAMENTS[1]?.id, 'trn-darwin-cup-2026');
  assert.equal(SEED_TOURNAMENTS[1]?.name, 'Darwin Cup 2026');
  assert.equal(SEED_NEWS.length, 0);

  assert.equal(FIRDAUS_CUP_INITIAL_RANKINGS.length, 148);
  assert.equal(DARWIN_CUP_INITIAL_RANKINGS.length, 148);
  const customInitial = buildInitialRankings(
    FIRDAUS_CUP_STANDINGS,
    SEED_TOURNAMENTS[0]?.initialRankings
  );
  assert.equal(customInitial.length, 148);
  assert.equal(customInitial[0]?.sNo, 1);
  assert.equal(customInitial[0]?.name, 'Godfrid Harry Mollyson Siregar');
  assert.equal(customInitial[0]?.gender, 'Putra');
  assert.equal(customInitial[0]?.nationalRating, 2243);
  assert.equal(customInitial[0]?.clubCity, 'Sagulung');
  assert.equal(customInitial[5]?.name, 'Jonathan Charmian Vivaldy');
  assert.equal(customInitial[5]?.nationalRating, 1896);
  assert.equal(customInitial[5]?.internationalRating, 1875);
  assert.equal(customInitial[26]?.name, 'Angel Priscilla Simanjuntak');
  assert.equal(customInitial[26]?.gender, 'Putri');
  assert.equal(customInitial[147]?.sNo, 148);
  assert.equal(customInitial[147]?.name, 'Zulkifli Ritonga');
  assert.equal(customInitial[147]?.clubCity, 'Batam Kota');

  const darwinInitial = buildInitialRankings([], SEED_TOURNAMENTS[1]?.initialRankings);
  assert.equal(darwinInitial.length, 148);
  assert.equal(darwinInitial[0]?.rating, 2243);
  assert.equal(darwinInitial[2]?.name, 'Yanurisman Candra');
  assert.equal(darwinInitial[2]?.rating, 2026);
  assert.equal(darwinInitial[2]?.clubCity, 'Kepri - Tanjung Pinang');
  assert.equal(darwinInitial[5]?.name, 'Jonathan Charmian Vivaldy');
  assert.equal(darwinInitial[5]?.rating, 1896);
  assert.equal(darwinInitial[5]?.internationalRating, undefined);

  const fallbackInitial = buildInitialRankings(FIRDAUS_CUP_STANDINGS);
  assert.equal(fallbackInitial.length, 92);
  assert.equal(fallbackInitial[0]?.sNo, 1);

  const pairings = SEED_TOURNAMENTS[0]?.pairings ?? [];
  assert.deepEqual(filterPairingsByRound(pairings, 3), [3]);
  assert.deepEqual(filterPairingsByRound(pairings, 'all'), [1, 2, 3, 4, 5, 6, 7]);
});

test('parseStandingsExcelBuffer parses .xlsx and .xls workbooks including Swiss-Manager headers and half points', () => {
  const sampleXlsx = generateSampleExcelBytes();
  const parsedSample = parseStandingsExcelBuffer(sampleXlsx);
  assert.equal(parsedSample.errors.length, 0);
  assert.equal(parsedSample.standings.length, 6);
  assert.equal(parsedSample.standings[0]?.name, 'Godfrid Harry Mollyson Siregar');
  assert.equal(parsedSample.standings[0]?.points, 6.5);

  const swissSheet = XLSX.utils.aoa_to_sheet([
    ['Kejuaraan Catur Batam 2026'],
    ['Final Ranking'],
    ['Rank', 'S. No.', 'Name', 'Rating', 'FED', 'Category', 'Pts.', 'DE', 'BH', 'SB', 'PS'],
    [1, 4, 'Suhandri, PM', 1992, 'INA', 'Senior', '6½', 0, 32, '29,5', 26],
    [2, 7, 'Jonathan Charmian Vivaldy', 1896, 'INA', 'Senior', '6,0', 0, 32, '25,5', 26],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, swissSheet, 'Standings');

  const xlsBytes = XLSX.write(wb, { bookType: 'biff8', type: 'array' }) as ArrayBuffer;
  const parsedXls = parseStandingsExcelBuffer(xlsBytes);
  assert.equal(parsedXls.errors.length, 0);
  assert.equal(parsedXls.standings.length, 2);
  assert.equal(parsedXls.standings[0]?.sNo, 4);
  assert.equal(parsedXls.standings[0]?.points, 6.5);
  assert.equal(parsedXls.standings[0]?.pointsDisplay, '6½');
  assert.equal(parsedXls.standings[0]?.rating, 1992);
  assert.equal(parsedXls.standings[1]?.points, 6);

  const emptyParse = parseStandingsExcelBuffer(new Uint8Array(0));
  assert.equal(emptyParse.standings.length, 0);
  assert.ok(emptyParse.errors.length > 0);
});

test('migratePortalData preserves admin edits on Firdaus Cup 2026', () => {
  const edited = {
    ...SEED_PORTAL_DATA,
    tournaments: SEED_PORTAL_DATA.tournaments.map((t) =>
      t.id === 'trn-kejurkot-2026'
        ? {
            ...t,
            name: 'Firdaus Cup 2026 (Revisi)',
            venue: 'Aula Baru Batam Center',
            chiefArbiter: 'WN Wasit Baru, FA',
          }
        : t
    ),
  };

  const migrated = migratePortalData(edited);
  assert.equal(migrated.tournaments[0]?.name, 'Firdaus Cup 2026 (Revisi)');
  assert.equal(migrated.tournaments[0]?.venue, 'Aula Baru Batam Center');
  assert.equal(migrated.tournaments[0]?.chiefArbiter, 'WN Wasit Baru, FA');
});

test('All Firdaus Cup & Darwin Cup participants are registered as Atlet without ID PERCASI or FIDE ID', () => {
  assert.ok(SEED_ATHLETES.length >= 148);
  const seedNames = new Set(SEED_ATHLETES.map((a) => normalizeAthleteName(a.fullName)));
  FIRDAUS_CUP_STANDINGS.forEach((entry) => {
    assert.ok(
      seedNames.has(normalizeAthleteName(entry.name)),
      `Missing Firdaus Cup participant in SEED_ATHLETES: ${entry.name}`
    );
  });
  DARWIN_CUP_INITIAL_RANKINGS.forEach((entry) => {
    assert.ok(
      seedNames.has(normalizeAthleteName(entry.name)),
      `Missing Darwin Cup participant in SEED_ATHLETES: ${entry.name}`
    );
  });

  SEED_ATHLETES.forEach((athlete) => {
    assert.equal(athlete.federationStatus, 'Atlet');
    assert.equal('percasiId' in athlete, false);
    assert.equal('fideId' in athlete, false);
  });

  const legacyCached = {
    ...SEED_PORTAL_DATA,
    athletes: [
      {
        ...SEED_ATHLETES[0]!,
        percasiId: 'IDN-BTM-17001',
        fideId: '7106420',
        federationStatus: 'Aktif' as const,
      } as Athlete,
    ],
  };

  const migrated = migratePortalData(legacyCached);
  assert.equal(migrated.athletes.length, SEED_ATHLETES.length);
  migrated.athletes.forEach((athlete) => {
    assert.equal(athlete.federationStatus, 'Atlet');
    assert.equal('percasiId' in athlete, false);
    assert.equal('fideId' in athlete, false);
  });
});

test('migratePortalData upgrades cached Firdaus Cup and Darwin Cup initialRankings while preserving valid edits', () => {
  const cachedWithManualDarwinAndRound8 = {
    ...SEED_PORTAL_DATA,
    tournaments: [
      {
        ...SEED_PORTAL_DATA.tournaments[0]!,
        initialRankings: undefined,
        pairings: [
          ...SEED_PORTAL_DATA.tournaments[0]!.pairings,
          { round: 8, board: 1, whiteName: 'Suhandri, PM', blackName: 'Nurdin Simanjuntak, NM', result: '1 - 0' },
        ],
      },
      {
        ...SEED_PORTAL_DATA.tournaments[1]!,
        id: 'trn-custom-darwin',
        name: 'Darwin Cup 2026',
        venue: 'Hotel Harmoni Batam',
        initialRankings: [{ sNo: 1, name: 'Godfrid Harry Mollyson Siregar' }],
        participantsCount: 10,
      },
    ],
  };

  const migrated = migratePortalData(cachedWithManualDarwinAndRound8);
  assert.equal(migrated.tournaments[0]?.initialRankings?.length, 148);
  assert.equal(migrated.tournaments[0]?.pairings.length, 323);
  assert.equal(migrated.tournaments[0]?.pairings.some((p) => p.round === 8), true);
  assert.equal(migrated.tournaments[1]?.name, 'Darwin Cup 2026');
  assert.equal(migrated.tournaments[1]?.venue, 'Hotel Harmoni Batam');
  assert.equal(migrated.tournaments[1]?.participantsCount, 148);
  assert.equal(migrated.tournaments[1]?.initialRankings?.length, 148);
});

test('parsePairingsExcelBuffer and mergeRoundPairings parse .xlsx/.xls Swiss-Manager round pairings and merge by round', () => {
  const sampleBytes = generateSamplePairingsExcelBytes(4);
  const parsedSample = parsePairingsExcelBuffer(sampleBytes, 4);
  assert.equal(parsedSample.errors.length, 0);
  assert.equal(parsedSample.pairings.length, 3);
  assert.deepEqual(parsedSample.detectedRounds, [4]);
  assert.equal(parsedSample.pairings[0]?.whiteSeed, 1);
  assert.equal(parsedSample.pairings[0]?.blackSeed, 2);
  assert.equal(parsedSample.pairings[0]?.result, '1 - 0');
  assert.equal(parsedSample.pairings[1]?.result, '½ - ½');
  assert.equal(parsedSample.pairings[2]?.result, '*');

  // Swiss-Manager export with repeated S. No. and Pts headers in .xls format
  const swissPairingSheet = XLSX.utils.aoa_to_sheet([
    ['Pairing Round 5'],
    ['Bo.', 'S. No.', 'Putih', 'Pts', 'Res.', 'Pts', 'Hitam', 'S. No.'],
    [1, 7, 'Jon Toni', '4', '0 - 1', '4', 'Jonathan Charmian Vivaldy', 6],
    [2, 4, 'Suhandri, PM', '3½', '1/2-1/2', '3½', 'Sahat Sitanggang, NM', 2],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, swissPairingSheet, 'Babak 5');
  const xlsBytes = XLSX.write(wb, { bookType: 'biff8', type: 'array' }) as ArrayBuffer;

  const parsedSwiss = parsePairingsExcelBuffer(xlsBytes, 5);
  assert.equal(parsedSwiss.errors.length, 0);
  assert.equal(parsedSwiss.pairings.length, 2);
  assert.equal(parsedSwiss.pairings[0]?.round, 5);
  assert.equal(parsedSwiss.pairings[0]?.whiteSeed, 7);
  assert.equal(parsedSwiss.pairings[0]?.blackSeed, 6);
  assert.equal(parsedSwiss.pairings[0]?.whitePoints, '4');
  assert.equal(parsedSwiss.pairings[1]?.result, '½ - ½');

  // Multi-sheet workbook auto-detection
  const multiWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    multiWb,
    XLSX.utils.aoa_to_sheet([
      ['Meja', 'Putih', 'Hasil', 'Hitam'],
      [1, 'Pemain A', '1 - 0', 'Pemain B'],
    ]),
    'Babak 1'
  );
  XLSX.utils.book_append_sheet(
    multiWb,
    XLSX.utils.aoa_to_sheet([
      ['Meja', 'Putih', 'Hasil', 'Hitam'],
      [1, 'Pemain B', '0 - 1', 'Pemain A'],
    ]),
    'Babak 2'
  );
  const multiBytes = XLSX.write(multiWb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const parsedMulti = parsePairingsExcelBuffer(multiBytes);
  assert.equal(parsedMulti.errors.length, 0);
  assert.deepEqual(parsedMulti.detectedRounds, [1, 2]);
  assert.equal(parsedMulti.pairings.length, 2);

  // Merge replaces only target round while keeping other rounds intact
  const merged = mergeRoundPairings(parsedMulti.pairings, parsedSwiss.pairings, [5]);
  assert.equal(merged.length, 4);
  assert.deepEqual(
    merged.map((m) => m.round),
    [1, 2, 5, 5]
  );

  // CSV pairing parsing
  const csvResult = parsePairingsCsv('Meja,Putih,Hasil,Hitam\n1,Suhandri,1-0,Sahat Sitanggang', 3);
  assert.equal(csvResult.errors.length, 0);
  assert.equal(csvResult.pairings[0]?.round, 3);
  assert.equal(csvResult.pairings[0]?.result, '1 - 0');
});

test('HERO_IMAGE_URL points to uploaded tournament photo and resolvePublicAssetUrl handles GitHub Pages subpaths', () => {
  assert.equal(HERO_IMAGE_URL, './assets/aistudio/IMG_20260919_105146_a1507b0b.jpg');
  assert.equal(
    resolvePublicAssetUrl(HERO_IMAGE_URL, './'),
    './assets/aistudio/IMG_20260919_105146_a1507b0b.jpg'
  );
  assert.equal(
    resolvePublicAssetUrl(HERO_IMAGE_URL, '/percasi-batam/'),
    '/percasi-batam/assets/aistudio/IMG_20260919_105146_a1507b0b.jpg'
  );
  assert.equal(
    resolvePublicAssetUrl('data/portal-data.json', '/percasi-batam'),
    '/percasi-batam/data/portal-data.json'
  );
});

test('pickAuthoritativePortalData ignores stale passive localStorage cache and honors newer published or admin-edited snapshots', () => {
  const stalePassiveLocal = {
    ...SEED_PORTAL_DATA,
    updatedAt: '2026-12-01T00:00:00.000Z',
    tournaments: [SEED_PORTAL_DATA.tournaments[0]!],
  };
  const resolvedVisitor = pickAuthoritativePortalData({
    seedData: SEED_PORTAL_DATA,
    publishedData: null,
    localData: stalePassiveLocal,
    localEdited: false,
    migrate: migratePortalData,
  });
  assert.equal(resolvedVisitor.tournaments.length, 2);
  assert.equal(resolvedVisitor.tournaments[1]?.id, 'trn-darwin-cup-2026');

  const newerPublished = {
    ...SEED_PORTAL_DATA,
    updatedAt: '2026-11-28T10:00:00.000Z',
    tournaments: [
      ...SEED_PORTAL_DATA.tournaments,
      {
        ...SEED_PORTAL_DATA.tournaments[1]!,
        id: 'trn-published-new',
        name: 'Batam Open 2026',
      },
    ],
  };
  const resolvedWithPublished = pickAuthoritativePortalData({
    seedData: SEED_PORTAL_DATA,
    publishedData: newerPublished,
    localData: stalePassiveLocal,
    localEdited: false,
    migrate: migratePortalData,
  });
  assert.equal(resolvedWithPublished.tournaments.length, 3);
  assert.equal(resolvedWithPublished.tournaments[2]?.name, 'Batam Open 2026');

  const newerLocalAdmin = {
    ...newerPublished,
    updatedAt: '2026-11-29T10:00:00.000Z',
    tournaments: [
      ...newerPublished.tournaments,
      {
        ...SEED_PORTAL_DATA.tournaments[1]!,
        id: 'trn-local-new',
        name: 'Walikota Cup 2026',
      },
    ],
  };
  const resolvedAdmin = pickAuthoritativePortalData({
    seedData: SEED_PORTAL_DATA,
    publishedData: newerPublished,
    localData: newerLocalAdmin,
    localEdited: true,
    migrate: migratePortalData,
  });
  assert.equal(resolvedAdmin.tournaments.length, 4);
  assert.equal(resolvedAdmin.tournaments[3]?.name, 'Walikota Cup 2026');
});

