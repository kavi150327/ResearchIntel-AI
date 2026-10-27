import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'error'
      ? AlertCircle
      : Info;

  const borderClass =
    toast.type === 'success'
      ? 'border-emerald-500/40 bg-slate-950/95 text-emerald-300'
      : toast.type === 'error'
      ? 'border-rose-500/40 bg-slate-950/95 text-rose-300'
      : 'border-cyan-500/40 bg-slate-950/95 text-cyan-300';

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 text-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-bold text-white leading-tight">{toast.title}</div>
        {toast.message && <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{toast.message}</div>}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-white p-0.5 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
