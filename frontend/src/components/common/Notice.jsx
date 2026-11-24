import { AlertTriangle, Info } from 'lucide-react';

// Compact, low-emphasis notice (industry style: informative without dominating the page).
export default function Notice({ children, tone = 'info', className = '' }) {
  const tones = {
    info: { box: 'border-white/[0.07] bg-white/[0.025] text-slate-300', icon: 'text-blue-300', Icon: Info },
    warn: { box: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-100', icon: 'text-amber-300', Icon: AlertTriangle },
  };
  const t = tones[tone] ?? tones.info;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed ${t.box} ${className}`}>
      <t.Icon size={15} className={`mt-[3px] shrink-0 ${t.icon}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
