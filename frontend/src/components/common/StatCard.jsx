import { Skeleton } from './States';

const ACCENTS = {
  purple: { icon: 'bg-brand-purple/[0.12] text-violet-300 ring-brand-purple/20', line: 'from-brand-purple/60' },
  blue: { icon: 'bg-brand-blue/[0.12] text-blue-300 ring-brand-blue/20', line: 'from-brand-blue/60' },
  cyan: { icon: 'bg-brand-cyan/[0.12] text-cyan-300 ring-brand-cyan/20', line: 'from-brand-cyan/60' },
  slate: { icon: 'bg-white/[0.06] text-slate-300 ring-white/10', line: 'from-white/30' },
};

export default function StatCard({ label, value, hint, icon: Icon, accent = 'purple', loading = false }) {
  const a = ACCENTS[accent] ?? ACCENTS.purple;
  const title = typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;

  return (
    <div className="card relative flex h-full flex-col overflow-hidden p-4">
      {/* Thin accent line along the top edge */}
      <span className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${a.line} via-transparent to-transparent`} aria-hidden="true" />

      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-medium text-slate-400" title={label}>{label}</p>
        {Icon && (
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-inset ${a.icon}`}>
            <Icon size={15} />
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <p className="mt-2 truncate text-[22px] font-semibold leading-8 tracking-tight text-white tabular-nums sm:text-2xl" title={title}>
          {value}
        </p>
      )}

      {loading ? (
        <Skeleton className="mt-2 h-3 w-32" />
      ) : (
        hint && <p className="mt-auto pt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
