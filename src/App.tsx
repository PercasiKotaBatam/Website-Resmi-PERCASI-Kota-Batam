import { useEffect, useState } from 'react';
import { AboutView } from './components/AboutView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminToolbar, type ProjectSyncStatus } from './components/AdminToolbar';
import { AthleteDetailView } from './components/AthleteDetailView';
import { BackupModal } from './components/BackupModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { LeaderboardView } from './components/LeaderboardView';
import { MemberFormModal } from './components/MemberFormModal';
import { MembersView } from './components/MembersView';
import { NewsDetailModal } from './components/NewsDetailModal';
import { NewsView } from './components/NewsView';
import { TournamentDetailModal } from './components/TournamentDetailModal';
import { TournamentsView } from './components/TournamentsView';
import { UploadTournamentModal } from './components/UploadTournamentModal';
import { SEED_PORTAL_DATA } from './data/seedData';
import type {
  Athlete,
  NavSection,
  NewsArticle,
  PortalData,
  Tournament,
} from './types/chess';
import { pickAuthoritativePortalData } from './utils/portalLogic';
import {
  fetchPublishedPortalData,
  loadPortalData,
  migratePortalData,
  readLocalPortalSnapshot,
  resetPortalData,
  savePortalData,
  syncPortalDataToServer,
} from './utils/storage';

const SECTION_LABELS: Record<NavSection, string> = {
  beranda: 'Beranda',
  berita: 'Berita',
  keanggotaan: 'Keanggotaan',
  turnamen: 'Turnamen',
  peringkat: 'Peringkat',
  tentang: 'Tentang Kami',
};

export default function App() {
  const [portalData, setPortalData] = useState<PortalData>(() => loadPortalData());
  const [activeSection, setActiveSection] = useState<NavSection>('beranda');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ProjectSyncStatus>('idle');

  const isAdminMode = Boolean(adminToken);

  const [selectedAthleteTarget, setSelectedAthleteTarget] = useState<string | null>(null);
  const [athleteNavStack, setAthleteNavStack] = useState<string[]>([]);
  const [returnTournamentId, setReturnTournamentId] = useState<string | null>(null);

  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [uploadTournamentOpen, setUploadTournamentOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchPublishedPortalData().then((publishedData) => {
      if (cancelled || !publishedData) return;
      const { data: localData, localEdited } = readLocalPortalSnapshot();
      const authoritative = pickAuthoritativePortalData({
        seedData: SEED_PORTAL_DATA,
        publishedData,
        localData,
        localEdited,
        migrate: migratePortalData,
      });
      setPortalData(authoritative);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commitPortalChange = (
    nextData: PortalData,
    options: { markLocalEdited?: boolean; tokenOverride?: string | null } = {}
  ) => {
    const { markLocalEdited = true, tokenOverride } = options;
    const saved = savePortalData(nextData, markLocalEdited);
    setPortalData(saved);
    const activeToken = tokenOverride !== undefined ? tokenOverride : adminToken;
    if (activeToken) {
      setSyncStatus('syncing');
      void syncPortalDataToServer(saved, activeToken).then((res) => {
        setSyncStatus(res.ok ? 'synced' : 'local-only');
      });
    } else {
      setSyncStatus('local-only');
    }
  };

  const handleNavigate = (section: NavSection) => {
    setSelectedAthleteTarget(null);
    setAthleteNavStack([]);
    setReturnTournamentId(null);
    setSelectedTournament(null);
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAthletePage = (
    identifier: string,
    fromTournamentId?: string
  ) => {
    if (selectedAthleteTarget) {
      setAthleteNavStack((prev) => [...prev, selectedAthleteTarget]);
    } else if (fromTournamentId) {
      setReturnTournamentId(fromTournamentId);
      setSelectedTournament(null);
    } else {
      setReturnTournamentId(null);
    }
    setSelectedAthleteTarget(identifier);
    window.scrollTo({ top: 0 });
  };

  const handleBackFromAthletePage = () => {
    if (athleteNavStack.length > 0) {
      const prevAthlete = athleteNavStack[athleteNavStack.length - 1];
      setAthleteNavStack((prev) => prev.slice(0, -1));
      setSelectedAthleteTarget(prevAthlete);
      window.scrollTo({ top: 0 });
      return;
    }

    setSelectedAthleteTarget(null);
    if (returnTournamentId) {
      const trn =
        portalData.tournaments.find((t) => t.id === returnTournamentId) ?? null;
      setReturnTournamentId(null);
      setSelectedTournament(trn);
    }
    window.scrollTo({ top: 0 });
  };

  const handleOpenTournamentById = (tournamentId: string) => {
    const trn = portalData.tournaments.find((t) => t.id === tournamentId) ?? null;
    setSelectedAthleteTarget(null);
    setAthleteNavStack([]);
    setReturnTournamentId(null);
    setActiveSection('turnamen');
    setSelectedTournament(trn);
    window.scrollTo({ top: 0 });
  };

  const handleOpenAddMember = () => {
    setEditingAthlete(null);
    setMemberFormOpen(true);
  };

  const handleOpenEditMember = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setMemberFormOpen(true);
  };

  const handleSaveMember = (athlete: Athlete, isEdit: boolean) => {
    const nextData: PortalData = {
      ...portalData,
      athletes: isEdit
        ? portalData.athletes.map((a) => (a.id === athlete.id ? athlete : a))
        : [athlete, ...portalData.athletes],
    };
    commitPortalChange(nextData);
  };

  const handleLogoutAdmin = () => {
    const token = adminToken;
    setAdminToken(null);
    setSyncStatus('idle');
    setMemberFormOpen(false);
    setUploadTournamentOpen(false);
    setEditingTournament(null);
    setBackupOpen(false);
    if (token) {
      void fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        // Ignore network errors on logout cleanup
      });
    }
  };

  const handleToggleAdmin = () => {
    if (isAdminMode) {
      handleLogoutAdmin();
    } else {
      setAdminLoginOpen(true);
    }
  };

  const handleAdminAuthSuccess = (token: string) => {
    setAdminToken(token);
    const { localEdited } = readLocalPortalSnapshot();
    if (localEdited) {
      setSyncStatus('syncing');
      void syncPortalDataToServer(portalData, token).then((res) => {
        setSyncStatus(res.ok ? 'synced' : 'local-only');
      });
    } else {
      setSyncStatus('idle');
    }
  };

  const handleOpenCreateTournament = () => {
    setEditingTournament(null);
    setUploadTournamentOpen(true);
  };

  const handleOpenEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setUploadTournamentOpen(true);
  };

  const handleSaveTournament = (tournament: Tournament, isEdit: boolean) => {
    const nextData: PortalData = {
      ...portalData,
      tournaments: isEdit
        ? portalData.tournaments.map((t) => (t.id === tournament.id ? tournament : t))
        : [tournament, ...portalData.tournaments],
    };
    commitPortalChange(nextData);
    setSelectedAthleteTarget(null);
    setAthleteNavStack([]);
    setReturnTournamentId(null);
    setActiveSection('turnamen');
    setSelectedTournament(tournament);
  };

  const handleRestoreData = (restored: PortalData) => {
    commitPortalChange(migratePortalData(restored));
  };

  const handleResetSeed = () => {
    const fresh = resetPortalData();
    setPortalData(fresh);
    if (adminToken) {
      setSyncStatus('syncing');
      void syncPortalDataToServer(fresh, adminToken).then((res) => {
        setSyncStatus(res.ok ? 'synced' : 'local-only');
      });
    } else {
      setSyncStatus('idle');
    }
  };

  const returnTournament = returnTournamentId
    ? portalData.tournaments.find((t) => t.id === returnTournamentId)
    : undefined;
  const backLabel =
    athleteNavStack.length > 0
      ? 'Kembali ke Atlet Sebelumnya'
      : returnTournament
        ? `Kembali ke ${returnTournament.name}`
        : `Kembali ke ${SECTION_LABELS[activeSection]}`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        isAdminMode={isAdminMode}
        onToggleAdmin={handleToggleAdmin}
      />

      {isAdminMode && (
        <AdminToolbar
          syncStatus={syncStatus}
          onAddMember={handleOpenAddMember}
          onUploadTournament={handleOpenCreateTournament}
          onOpenBackup={() => setBackupOpen(true)}
          onExitAdmin={handleLogoutAdmin}
        />
      )}

      <main className="flex-1">
        {selectedAthleteTarget ? (
          <AthleteDetailView
            athleteIdentifier={selectedAthleteTarget}
            athletes={portalData.athletes}
            tournaments={portalData.tournaments}
            isAdminMode={isAdminMode}
            backLabel={backLabel}
            onBack={handleBackFromAthletePage}
            onSelectAthlete={(name) => handleOpenAthletePage(name)}
            onEditMember={handleOpenEditMember}
            onSelectTournament={handleOpenTournamentById}
          />
        ) : (
          <>
            {activeSection === 'beranda' && (
              <HomeView
                athletes={portalData.athletes}
                tournaments={portalData.tournaments}
                news={portalData.news}
                onNavigate={handleNavigate}
                onSelectAthlete={(athlete) => handleOpenAthletePage(athlete.id)}
                onSelectTournament={setSelectedTournament}
                onSelectNews={setSelectedNews}
              />
            )}

            {activeSection === 'berita' && (
              <NewsView
                news={portalData.news}
                onSelectNews={setSelectedNews}
              />
            )}

            {activeSection === 'keanggotaan' && (
              <MembersView
                athletes={portalData.athletes}
                isAdminMode={isAdminMode}
                onSelectAthlete={(athlete) => handleOpenAthletePage(athlete.id)}
                onAddMember={handleOpenAddMember}
                onEditMember={handleOpenEditMember}
              />
            )}

            {activeSection === 'turnamen' && (
              <TournamentsView
                tournaments={portalData.tournaments}
                isAdminMode={isAdminMode}
                onSelectTournament={setSelectedTournament}
                onSelectAthlete={(name) => handleOpenAthletePage(name)}
                onUploadTournament={handleOpenCreateTournament}
                onEditTournament={handleOpenEditTournament}
              />
            )}

            {activeSection === 'peringkat' && (
              <LeaderboardView
                athletes={portalData.athletes}
                onSelectAthlete={(athlete) => handleOpenAthletePage(athlete.id)}
              />
            )}

            {activeSection === 'tentang' && <AboutView />}
          </>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <TournamentDetailModal
        tournament={selectedTournament}
        isAdminMode={isAdminMode}
        onClose={() => setSelectedTournament(null)}
        onSelectAthlete={(name, tournamentId) =>
          handleOpenAthletePage(name, tournamentId)
        }
        onEditTournament={handleOpenEditTournament}
      />

      <NewsDetailModal
        article={selectedNews}
        onClose={() => setSelectedNews(null)}
      />

      <MemberFormModal
        isOpen={memberFormOpen}
        editingAthlete={editingAthlete}
        onClose={() => setMemberFormOpen(false)}
        onSave={handleSaveMember}
      />

      <UploadTournamentModal
        isOpen={uploadTournamentOpen}
        editingTournament={editingTournament}
        onClose={() => {
          setUploadTournamentOpen(false);
          setEditingTournament(null);
        }}
        onSaveTournament={handleSaveTournament}
      />

      <BackupModal
        isOpen={backupOpen}
        portalData={portalData}
        onClose={() => setBackupOpen(false)}
        onRestoreData={handleRestoreData}
        onResetToSeed={handleResetSeed}
      />

      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />
    </div>
  );
}
