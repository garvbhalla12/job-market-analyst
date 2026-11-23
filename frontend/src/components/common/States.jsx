import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.06] ${className}`} />;
}

export function ErrorState({ message, onRetry, compact = false }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-14'}`}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
        <AlertTriangle size={20} />
      </div>
      <p className="max-w-md px-4 text-sm text-slate-300">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost mt-4">
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No data to show', description, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-sm px-4 text-sm text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white ${className}`}
      aria-hidden="true"
    />
  );
}

export function FullScreenLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <Spinner className="h-5 w-5" /> {label}
      </div>
    </div>
  );
}
