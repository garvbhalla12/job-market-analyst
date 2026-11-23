export default function Logo({ size = 32 }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="jma-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="#161f36" />
        <rect x="6" y="16" width="4" height="10" rx="1.5" fill="url(#jma-logo)" />
        <rect x="14" y="10" width="4" height="16" rx="1.5" fill="url(#jma-logo)" />
        <rect x="22" y="5" width="4" height="21" rx="1.5" fill="url(#jma-logo)" />
      </svg>
      <span className="text-sm font-semibold tracking-tight text-white">Job Market Analyst</span>
    </div>
  );
}
