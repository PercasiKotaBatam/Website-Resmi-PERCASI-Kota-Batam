import type { User } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
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
import {
  bootstrapCloudIfEmpty,
  checkIsFirebaseAdmin,
  publishPortalDataToCloud,
  signOutFirebaseAdmin,
  subscribeCloudPortalData,
  subscribeFirebaseAuthState,
} from './utils/firebase';
import {
  pickAuthoritativePortalData,
  syncAthletesFromTournaments,
} from './utils/portalLogic';
import { isStaticAdminToken } from './utils/staticAdminAuth';
import {
  fetchPublishedPortalData,
  loadPortalData,
  migratePortalData,
  readLocalPortalSnapshot,
  resetPortalData,
  savePortalData,
  syncPortalDataToServer,
} from './utils/storage';

const ADMIN_SESSION_TOKEN_KEY = 'percasi_batam_admin_session_token_v1';

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
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [firebaseAdminUser, setFirebaseAdminUser] = useState<User | null>(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<ProjectSyncStatus>('idle');

  const cloudSnapshotRef = useRef<PortalData | null>(null);
  const portalDataRef = useRef<PortalData>(portalData);
  portalDataRef.current = portalData;

  const isCloudAdmin = Boolean(firebaseAdminUser);
  const isAdminMode = Boolean(adminToken || firebaseAdminUser);

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

  // Restore server/local session token if present on refresh
  useEffect(() => {
    const savedToken = adminToken;
    if (!savedToken || isStaticAdminToken(savedToken) || savedToken.startsWith('firebase:')) {
      return;
    }
    let cancelled = false;
    fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${savedToken}` },
      cache: 'no-store',
    })
      .then((res) => {
        if (!cancelled && res.status === 401) {
          setAdminToken(null);
          try {
            window.sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // ignore network errors on static hosts
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load published static/server JSON fallback (never overwrites newer cloud or local-edited snapshots)
  useEffect(() => {
    let cancelled = false;
    void fetchPublishedPortalData().then((publishedData) => {
      if (cancelled || !publishedData || cloudSnapshotRef.current) return;
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

  // Subscribe to shared Cloud Firestore state (keeps AI Studio and GitHub Pages identical)
  useEffect(() => {
    const unsubscribe = subscribeCloudPortalData(
      (cloudRaw) => {
        const migratedCloud = migratePortalData(cloudRaw);
        cloudSnapshotRef.current = migratedCloud;

        const { data: localData, localEdited } = readLocalPortalSnapshot();
        const cloudMs = Date.parse(migratedCloud.updatedAt) || 0;
        const localMs = localData ? Date.parse(localData.updatedAt) || 0 : 0;

        if (localEdited && localData && localMs > cloudMs) {
          // Local edit is strictly newer and awaiting cloud push
          return;
        }

        savePortalData(migratedCloud, false);
        setPortalData(migratedCloud);
        setSelectedTournament((prev) =>
          prev
            ? migratedCloud.tournaments.find((t) => t.id === prev.id) ?? prev
            : null
        );
      },
      () => {
        // Keep cached/seed data active if offline or unreachable
      }
    );
    return unsubscribe;
  }, []);

  // Observe Firebase Google Admin auth state across page refreshes
  useEffect(() => {
    const unsubscribe = subscribeFirebaseAuthState((user) => {
      if (!user) {
        setFirebaseAdminUser(null);
        return;
      }
      void checkIsFirebaseAdmin(user)
        .then((allowed) => {
          if (!allowed) {
            setFirebaseAdminUser(null);
            return;
          }
          setFirebaseAdminUser(user);
          setSyncStatus('cloud-syncing');
          const currentLocal = portalDataRef.current;
          const { data: localSnapshot, localEdited } = readLocalPortalSnapshot();

          void bootstrapCloudIfEmpty(currentLocal, user)
            .then(async ({ seeded, cloudData }) => {
              if (seeded) {
                cloudSnapshotRef.current = currentLocal;
                savePortalData(currentLocal, false);
                setSyncStatus('cloud-synced');
                return;
              }
              if (cloudData) {
                const migratedCloud = migratePortalData(cloudData);
                cloudSnapshotRef.current = migratedCloud;
                const cloudMs = Date.parse(migratedCloud.updatedAt) || 0;
                const localMs = localSnapshot
                  ? Date.parse(localSnapshot.updatedAt) || 0
                  : 0;

                if (localEdited && localSnapshot && localMs > cloudMs) {
                  const localMigrated = migratePortalData(localSnapshot);
                  await publishPortalDataToCloud(localMigrated, migratedCloud, user);
                  cloudSnapshotRef.current = localMigrated;
                  savePortalData(localMigrated, false);
                  setPortalData(localMigrated);
                } else {
                  savePortalData(migratedCloud, false);
                  setPortalData(migratedCloud);
                }
              }
              setSyncStatus('cloud-synced');
            })
            .catch(() => {
              setSyncStatus('cloud-error');
            });
        })
        .catch(() => {
          setFirebaseAdminUser(null);
        });
    });
    return unsubscribe;
  }, []);

  const commitPortalChange = (
    nextData: PortalData,
    options: { markLocalEdited?: boolean; tokenOverride?: string | null } = {}
  ) => {
    const { markLocalEdited = true, tokenOverride } = options;
    const saved = savePortalData(nextData, markLocalEdited);
    setPortalData(saved);

    if (firebaseAdminUser) {
      setSyncStatus('cloud-syncing');
      void publishPortalDataToCloud(saved, cloudSnapshotRef.current, firebaseAdminUser)
        .then(() => {
          cloudSnapshotRef.current = saved;
          savePortalData(saved, false);
          setSyncStatus('cloud-synced');
        })
        .catch(() => {
          setSyncStatus('cloud-error');
        });
      return;
    }

    const activeToken = tokenOverride !== undefined ? tokenOverride : adminToken;
    if (activeToken && !isStaticAdminToken(activeToken) && !activeToken.startsWith('firebase:')) {
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
    setFirebaseAdminUser(null);
    setSyncStatus('idle');
    setMemberFormOpen(false);
    setUploadTournamentOpen(false);
    setEditingTournament(null);
    setBackupOpen(false);
    try {
      window.sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    } catch {
      // ignore
    }
    void signOutFirebaseAdmin();
    if (token && !isStaticAdminToken(token) && !token.startsWith('firebase:')) {
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

  const handleAdminAuthSuccess = (
    token: string,
    _username: string,
    firebaseUser?: User
  ) => {
    if (firebaseUser) {
      setFirebaseAdminUser(firebaseUser);
      setAdminToken(null);
      try {
        window.sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
      } catch {
        // ignore
      }
      return;
    }

    setAdminToken(token);
    try {
      window.sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token);
    } catch {
      // ignore
    }
    if (isStaticAdminToken(token)) {
      setSyncStatus('local-only');
      return;
    }
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
    const nextTournaments = isEdit
      ? portalData.tournaments.map((t) => (t.id === tournament.id ? tournament : t))
      : [tournament, ...portalData.tournaments];
    const nextData: PortalData = {
      ...portalData,
      athletes: syncAthletesFromTournaments(portalData.athletes, nextTournaments),
      tournaments: nextTournaments,
    };
    commitPortalChange(nextData);
    setSelectedAthleteTarget(null);
    setAthleteNavStack([]);
    setReturnTournamentId(null);
    setActiveSection('turnamen');
    setSelectedTournament(tournament);
  };

  const handleUpdateTournamentInPlace = (tournament: Tournament) => {
    const nextTournaments = portalData.tournaments.map((t) =>
      t.id === tournament.id ? tournament : t
    );
    const nextData: PortalData = {
      ...portalData,
      athletes: syncAthletesFromTournaments(portalData.athletes, nextTournaments),
      tournaments: nextTournaments,
    };
    commitPortalChange(nextData);
    setSelectedTournament(tournament);
  };

  const handleRestoreData = (restored: PortalData) => {
    commitPortalChange(migratePortalData(restored));
  };

  const handleResetSeed = () => {
    const fresh = resetPortalData();
    setPortalData(fresh);
    if (firebaseAdminUser) {
      setSyncStatus('cloud-syncing');
      void publishPortalDataToCloud(fresh, cloudSnapshotRef.current, firebaseAdminUser)
        .then(() => {
          cloudSnapshotRef.current = fresh;
          setSyncStatus('cloud-synced');
        })
        .catch(() => {
          setSyncStatus('cloud-error');
        });
    } else if (adminToken && !isStaticAdminToken(adminToken)) {
      setSyncStatus('syncing');
      void syncPortalDataToServer(fresh, adminToken).then((res) => {
        setSyncStatus(res.ok ? 'synced' : 'local-only');
      });
    } else if (isStaticAdminToken(adminToken)) {
      setSyncStatus('local-only');
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
          isCloudAdmin={isCloudAdmin}
          onConnectCloudAdmin={() => setAdminLoginOpen(true)}
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
                athletes={portalData.athletes}
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
        athletes={portalData.athletes}
        isAdminMode={isAdminMode}
        onClose={() => setSelectedTournament(null)}
        onSelectAthlete={(name, tournamentId) =>
          handleOpenAthletePage(name, tournamentId)
        }
        onEditTournament={handleOpenEditTournament}
        onUpdateTournament={handleUpdateTournamentInPlace}
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
