export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-white sm:text-[22px] sm:leading-8">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
