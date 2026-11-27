import { CheckCircle2, Database, FileSpreadsheet, RefreshCw, Shield, UserPlus } from 'lucide-react';

export type ProjectSyncStatus = 'idle' | 'syncing' | 'synced' | 'local-only';

interface AdminToolbarProps {
  syncStatus?: ProjectSyncStatus;
  onAddMember: () => void;
  onUploadTournament: () => void;
  onOpenBackup: () => void;
  onExitAdmin: () => void;
}

export function AdminToolbar({
  syncStatus = 'idle',
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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:flex-nowrap lg:px-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-950 whitespace-nowrap">
          <Shield className="h-4 w-4 text-amber-800 shrink-0" aria-hidden="true" />
          <span>Mode Admin Aktif</span>
          <span aria-hidden="true" className="text-amber-400">
            ·
          </span>
          {syncStatus === 'syncing' ? (
            <span className="inline-flex items-center gap-1 font-normal text-amber-900">
              <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
              Menyinkronkan ke proyek...
            </span>
          ) : syncStatus === 'synced' ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Tersimpan ke data proyek (siap push ke GitHub)
            </span>
          ) : syncStatus === 'local-only' ? (
            <span className="font-normal text-amber-900">
              Tersimpan lokal (ekspor portal-data.json untuk GitHub)
            </span>
          ) : (
            <span className="font-normal text-amber-900">
              Perubahan otomatis disinkronkan ke data proyek
            </span>
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
