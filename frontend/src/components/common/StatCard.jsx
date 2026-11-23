import { Skeleton } from './States';

const ACCENTS = {
  purple: 'bg-brand-purple/15 text-violet-300',
  blue: 'bg-brand-blue/15 text-blue-300',
  cyan: 'bg-brand-cyan/15 text-cyan-300',
  slate: 'bg-white/10 text-slate-300',
};

export default function StatCard({ label, value, hint, icon: Icon, accent = 'purple', loading = false }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-white">{value}</p>
          )}
          {hint && !loading && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ACCENTS[accent]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
