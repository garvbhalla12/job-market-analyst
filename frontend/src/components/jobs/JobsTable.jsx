import { Briefcase } from 'lucide-react';
import { EmptyState, Skeleton } from '../common/States';
import { hasSalary, orDash } from '../../utils/format';

const WORKPLACE_STYLES = {
  remote: 'bg-brand-cyan/15 text-cyan-300 ring-brand-cyan/30',
  hybrid: 'bg-brand-purple/15 text-violet-300 ring-brand-purple/30',
  'on-site': 'bg-brand-blue/15 text-blue-300 ring-brand-blue/30',
  onsite: 'bg-brand-blue/15 text-blue-300 ring-brand-blue/30',
};

function Badge({ children, className = 'bg-white/5 text-slate-300 ring-white/10' }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

const workplaceBadge = (value) => {
  const v = String(value ?? '').trim();
  if (!v) return <span className="text-slate-500">—</span>;
  return <Badge className={WORKPLACE_STYLES[v.toLowerCase()]}>{v}</Badge>;
};

const employmentBadge = (value) => {
  const v = String(value ?? '').trim();
  if (!v) return <span className="text-slate-500">—</span>;
  return <Badge>{v}</Badge>;
};

const salaryCell = (salary) =>
  hasSalary(salary) ? <span className="text-slate-100">{salary}</span> : <span className="text-slate-500">Not disclosed</span>;

export default function JobsTable({ jobs, loading, emptyTitle = 'No jobs match your search', emptyDescription = 'Try different keywords or clear your filters.', rows = 6 }) {
  if (loading && (!jobs || jobs.length === 0)) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return <EmptyState icon={Briefcase} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Job title</th>
              <th className="px-3 py-3 font-medium">Company</th>
              <th className="px-3 py-3 font-medium">Location</th>
              <th className="px-3 py-3 font-medium">Salary</th>
              <th className="px-3 py-3 font-medium">Workplace</th>
              <th className="px-5 py-3 font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {jobs.map((job, i) => (
              <tr key={job.id ?? i} className="transition-colors hover:bg-white/[0.03]">
                <td className="max-w-[260px] px-5 py-3 font-medium text-slate-100">
                  <span className="line-clamp-2">{orDash(job.title)}</span>
                </td>
                <td className="max-w-[180px] px-3 py-3 text-slate-300">
                  <span className="line-clamp-2">{orDash(job.company)}</span>
                </td>
                <td className="max-w-[200px] px-3 py-3 text-slate-300">
                  <span className="line-clamp-2">{orDash(job.location)}</span>
                </td>
                <td className="px-3 py-3">{salaryCell(job.salary_range)}</td>
                <td className="px-3 py-3">{workplaceBadge(job.workplace_type)}</td>
                <td className="px-5 py-3">{employmentBadge(job.employment_type)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-white/[0.06] md:hidden">
        {jobs.map((job, i) => (
          <li key={job.id ?? i} className="space-y-2 p-4">
            <p className="font-medium text-slate-100">{orDash(job.title)}</p>
            <p className="text-sm text-slate-300">
              {orDash(job.company)} <span className="text-slate-500">·</span> {orDash(job.location)}
            </p>
            <p className="text-sm">{salaryCell(job.salary_range)}</p>
            <div className="flex flex-wrap gap-2">
              {workplaceBadge(job.workplace_type)}
              {employmentBadge(job.employment_type)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
