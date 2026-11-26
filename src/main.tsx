import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Error captured to prevent silent white screen
  }

  handleReset = () => {
    try {
      window.localStorage.removeItem('percasi_batam_portal_v3');
    } catch {
      // Ignore storage failures
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
          <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-extrabold text-[#0F2342]">
              Portal PERCASI Kota Batam
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Terjadi kendala saat memuat data peramban. Klik tombol di bawah untuk memulihkan tampilan awal.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-[#0F2342] px-4 text-xs font-bold text-white hover:bg-[#173360]"
            >
              Muat Ulang Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
