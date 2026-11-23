import { Info } from 'lucide-react';

export default function Notice({ children, tone = 'info', className = '' }) {
  const tones = {
    info: 'border-brand-blue/25 bg-brand-blue/10 text-blue-200',
    warn: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${tones[tone]} ${className}`}>
      <Info size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
