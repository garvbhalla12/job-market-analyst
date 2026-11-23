import { useState } from 'react';
import { Briefcase, Building2, Trophy } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import LimitSelect from '../components/common/LimitSelect';
import { EmptyState, ErrorState, Skeleton } from '../components/common/States';
import ChartCard from '../components/charts/ChartCard';
import HBarChart from '../components/charts/HBarChart';
import useApi from '../hooks/useApi';
import analyticsService from '../services/analyticsService';
import { formatNumber, formatPercent } from '../utils/format';

export default function CompanyAnalytics() {
  const [limit, setLimit] = useState(15);
  const { data, loading, error, reload } = useApi((s) => analyticsService.companies(limit, s), [limit]);

  const rows = data?.top_companies || [];
  const top = rows[0];
  const chartHeight = Math.max(340, rows.length * 30);

  return (
    <>
      <PageHeader
        title="Company analytics"
        description="Companies with the most postings in the collected dataset. Postings with an unknown company are excluded."
        actions={<LimitSelect value={limit} onChange={setLimit} options={[10, 15, 25, 50]} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Companies" value={formatNumber(data?.total_companies)} hint="Distinct, known companies" icon={Building2} accent="purple" loading={loading && !data} />
        <StatCard label="Total postings" value={formatNumber(data?.total_jobs)} hint="Across all companies" icon={Briefcase} accent="blue" loading={loading && !data} />
        <StatCard label="Most active company" value={top?.company ?? '—'} hint={top ? `${formatNumber(top.job_count)} postings (${formatPercent(top.percentage)})` : undefined} icon={Trophy} accent="cyan" loading={loading && !data} />
      </div>

      <ChartCard
        title="Company comparison"
        subtitle="Number of postings per company"
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!rows.length}
        height={chartHeight}
      >
        <HBarChart height={chartHeight} labelWidth={170} data={rows.map((r) => ({ name: r.company, value: r.job_count, percentage: r.percentage }))} />
      </ChartCard>

      <Card className="mt-4" title="Top hiring companies" subtitle="Ranked by number of postings" bodyClassName="!p-0">
        {error ? (
          <ErrorState message={error} onRetry={reload} compact />
        ) : loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No company data available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-400">
                  <th className="w-16 px-5 py-3 font-medium">Rank</th>
                  <th className="px-3 py-3 font-medium">Company</th>
                  <th className="px-3 py-3 text-right font-medium">Postings</th>
                  <th className="px-5 py-3 text-right font-medium">Share of all postings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {rows.map((r, i) => (
                  <tr key={`${r.company}-${i}`} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-3 tabular-nums text-slate-500">{i + 1}</td>
                    <td className="px-3 py-3 font-medium text-slate-100">{r.company}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-200">{formatNumber(r.job_count)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-400">{formatPercent(r.percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
