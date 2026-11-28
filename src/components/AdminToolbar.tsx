import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  FileSpreadsheet,
  RefreshCw,
  Shield,
  UserPlus,
} from 'lucide-react';

export type ProjectSyncStatus =
  | 'idle'
  | 'cloud-syncing'
  | 'cloud-synced'
  | 'cloud-error'
  | 'syncing'
  | 'synced'
  | 'local-only';

interface AdminToolbarProps {
  syncStatus?: ProjectSyncStatus;
  syncErrorMessage?: string;
  isCloudAdmin?: boolean;
  onConnectCloudAdmin?: () => void;
  onForceCloudSync?: () => void;
  onAddMember: () => void;
  onUploadTournament: () => void;
  onOpenBackup: () => void;
  onExitAdmin: () => void;
}

export function AdminToolbar({
  syncStatus = 'idle',
  syncErrorMessage = '',
  isCloudAdmin = false,
  onConnectCloudAdmin,
  onForceCloudSync,
  onAddMember,
  onUploadTournament,
  onOpenBackup,
  onExitAdmin,
}: AdminToolbarProps) {
  return (
    <section
      aria-label="Panel Kendali Admin Pengkot"
      className="border-b border-amber-200 bg-amber-50/90"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-950">
          <Shield className="h-4 w-4 text-amber-800 shrink-0" aria-hidden="true" />
          <span>Mode Admin Aktif</span>
          <span aria-hidden="true" className="text-amber-400">
            ·
          </span>
          {syncStatus === 'cloud-syncing' ? (
            <span className="inline-flex items-center gap-1 font-normal text-amber-900">
              <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
              Menyinkronkan ke Cloud (Laptop, HP Android &amp; GitHub)...
            </span>
          ) : syncStatus === 'cloud-synced' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Sinkron Cloud Aktif · Laptop, HP Android &amp; GitHub sama
            </span>
          ) : syncStatus === 'cloud-error' ? (
            <span className="font-semibold text-[#B91C1C]">
              Gagal menyinkronkan ke Cloud
              {syncErrorMessage ? `: ${syncErrorMessage}` : ' — perubahan masih tersimpan lokal'}
            </span>
          ) : !isCloudAdmin ? (
            <span className="inline-flex items-center gap-1 font-semibold text-[#B91C1C]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Belum Sinkron Cloud — hanya tersimpan di perangkat ini (tidak muncul di HP Android)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
              <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
              Cloud Admin terhubung (Laptop, HP Android &amp; GitHub sinkron)
            </span>
          )}

          {!isCloudAdmin && onConnectCloudAdmin && (
            <button
              type="button"
              onClick={onConnectCloudAdmin}
              className="inline-flex h-7 items-center gap-1 rounded border border-emerald-700 bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
            >
              <Cloud className="h-3 w-3" aria-hidden="true" />
              <span>Aktifkan Sinkron Cloud (Google Admin)</span>
            </button>
          )}

          {isCloudAdmin && onForceCloudSync && syncStatus !== 'cloud-syncing' && (
            <button
              type="button"
              onClick={onForceCloudSync}
              className="inline-flex h-7 items-center gap-1 rounded border border-emerald-700 bg-white px-2.5 text-[11px] font-bold text-emerald-900 hover:bg-emerald-50 whitespace-nowrap"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              <span>{syncStatus === 'cloud-error' ? 'Coba Sinkron Ulang' : 'Sinkron Ulang Cloud'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#0F2342] px-3 text-xs font-semibold text-white hover:bg-[#173360] whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tambah Anggota</span>
          </button>

          <button
            type="button"
            onClick={onUploadTournament}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#0F2342] bg-white px-3 text-xs font-semibold text-[#0F2342] hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Upload Hasil Turnamen</span>
          </button>

          <button
            type="button"
            onClick={onOpenBackup}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Backup &amp; Restore Data</span>
          </button>

          <button
            type="button"
            onClick={onExitAdmin}
            className="inline-flex h-9 items-center rounded-md px-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-100 whitespace-nowrap shrink-0"
          >
            Tutup Admin
          </button>
        </div>
      </div>
    </section>
  );
}
