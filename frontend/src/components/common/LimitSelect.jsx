export default function LimitSelect({ value, onChange, options = [10, 15, 25, 50], label = 'Show top' }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input !w-auto !py-1.5"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
