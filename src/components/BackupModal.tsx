import { Download, RotateCcw, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PortalData } from '../types/chess';
import { validatePortalBackup } from '../utils/portalLogic';
import { downloadTextFile } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  portalData: PortalData;
  onClose: () => void;
  onRestoreData: (data: PortalData) => void;
  onResetToSeed: () => void;
}

export function BackupModal({
  isOpen,
  portalData,
  onClose,
  onRestoreData,
  onResetToSeed,
}: BackupModalProps) {
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStatusMessage('');
    setErrorMessage('');
    setConfirmReset(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `percasi-batam-backup-${stamp}.json`,
      JSON.stringify(portalData, null, 2),
      'application/json;charset=utf-8'
    );
    setErrorMessage('');
    setStatusMessage('Berkas backup JSON berhasil diunduh.');
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    setStatusMessage('');

    const text = await file.text();
    const validation = validatePortalBackup(text);
    if (!validation.valid || !validation.data) {
      setErrorMessage(
        validation.error ?? 'Berkas backup JSON tidak valid.'
      );
      return;
    }

    onRestoreData(validation.data);
    setStatusMessage(
      `Berhasil memulihkan ${validation.data.athletes.length} atlet, ${validation.data.tournaments.length} turnamen, dan ${validation.data.news.length} berita.`
    );
  };

  const handleReset = () => {
    onResetToSeed();
    setConfirmReset(false);
    setErrorMessage('');
    setStatusMessage('Data portal berhasil dikembalikan ke data awal resmi.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2
            id="backup-modal-title"
            className="text-lg font-extrabold text-[#0F2342]"
          >
            Backup &amp; Restore Data Portal
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal backup dan restore"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
            <p className="font-bold text-[#0F2342]">Ringkasan Data Tersimpan</p>
            <p className="font-mono-tabular mt-1">
              {portalData.athletes.length} Atlet · {portalData.tournaments.length}{' '}
              Turnamen · {portalData.news.length} Berita
            </p>
          </div>

          {statusMessage && (
            <div
              role="status"
              className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900"
            >
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-[#B91C1C]"
            >
              {errorMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white hover:bg-[#173360]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Export / Unduh Backup JSON</span>
            </button>

            <label
              htmlFor="restore-json-input"
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#0F2342] bg-white px-4 text-xs font-bold text-[#0F2342] hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Import / Restore dari Berkas JSON</span>
            </label>
            <input
              id="restore-json-input"
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="sr-only"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex h-10 items-center gap-1.5 text-xs font-semibold text-[#B91C1C] hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kembalikan ke Data Bawaan Awal</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                <span className="text-xs font-semibold text-[#B91C1C]">
                  Hapus perubahan lokal dan pulihkan data awal?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded bg-[#B91C1C] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Ya, Pulihkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
