import { CircleDollarSign, FileSearch, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Notice from '../components/common/Notice';
import { EmptyState, ErrorState, Skeleton } from '../components/common/States';
import ChartCard from '../components/charts/ChartCard';
import VBarChart from '../components/charts/VBarChart';
import DonutChart from '../components/charts/DonutChart';
import useApi from '../hooks/useApi';
import analyticsService from '../services/analyticsService';
import { formatNumber, formatPercent, formatUSD } from '../utils/format';

const PERIODS = {
  yr: { title: 'Annual salaries', unit: 'per year', short: '/yr' },
  hr: { title: 'Hourly salaries', unit: 'per hour', short: '/hr' },
};

function PeriodSection({ period, stats }) {
  const meta = PERIODS[period];
  const fmt = (v) => formatUSD(v, period);
  const chartData = [
    { name: 'Minimum', value: stats.minimum_salary },
    { name: 'Median', value: stats.median_salary },
    { name: 'Average', value: stats.average_salary },
    { name: 'Maximum', value: stats.maximum_salary },
  ];

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-white">
          {meta.title} <span className="ml-1 text-sm font-normal text-slate-400">USD {meta.unit}</span>
        </h2>
        <span className="text-xs text-slate-400">{formatNumber(stats.job_count)} postings with valid {period === 'yr' ? 'annual' : 'hourly'} ranges</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          <StatCard label="Average" value={fmt(stats.average_salary)} hint="Mean of range midpoints" accent="purple" />
          <StatCard label="Median" value={fmt(stats.median_salary)} hint="Median of range midpoints" accent="blue" />
          <StatCard label="Minimum" value={fmt(stats.minimum_salary)} hint="Lowest range start" accent="cyan" />
          <StatCard label="Maximum" value={fmt(stats.maximum_salary)} hint="Highest range end" accent="purple" />
        </div>
        <ChartCard className="lg:col-span-2" title={`${meta.title} comparison`} subtitle={`Summary statistics in USD ${meta.unit}`} height={260}>
          <VBarChart height={260} data={chartData} angle={0} valueLabel={`USD ${meta.short}`} formatValue={fmt} />
        </ChartCard>
      </div>
    </section>
  );
}

export default function SalaryAnalytics() {
  const salary = useApi((s) => analyticsService.salary(s), []);
  const overview = useApi((s) => analyticsService.overview(s), []);

  const byPeriod = salary.data?.salary_by_period || {};
  const periods = ['yr', 'hr'].filter((p) => byPeriod[p]);
  const o = overview.data;
  const sd = salary.data;
  const unparsed = o && sd ? Math.max(0, o.salary_disclosed - sd.total_parsed_jobs) : null;

  const periodMix = periods.map((p) => ({ name: PERIODS[p].title, value: byPeriod[p].job_count }));

  return (
    <>
      <PageHeader
        title="Salary analytics"
        description="Salary statistics for postings that disclose a pay range. Annual and hourly pay are analysed separately and never combined."
      />

      <Notice className="mb-6">
        All salary figures come from the source dataset in <strong>US dollars (USD)</strong>. Each statistic is calculated from the midpoint of a posting&apos;s pay range, separately for annual and hourly pay.
      </Notice>

      {salary.error ? (
        <Card>
          <ErrorState message={salary.error} onRetry={salary.reload} />
        </Card>
      ) : salary.loading && !salary.data ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : periods.length === 0 ? (
        <Card>
          <EmptyState title="No valid salary data" description="No postings with a parsable, valid salary range were found." icon={CircleDollarSign} />
        </Card>
      ) : (
        periods.map((p) => <PeriodSection key={p} period={p} stats={byPeriod[p]} />)
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Salary disclosure"
          subtitle="Postings that list a salary vs. not disclosed"
          loading={overview.loading}
          error={overview.error}
          onRetry={overview.reload}
          empty={!o}
          height={220}
        >
          <DonutChart
            height={220}
            centerLabel="Jobs"
            data={[
              { name: 'Salary disclosed', value: o?.salary_disclosed ?? 0 },
              { name: 'Not disclosed', value: o?.salary_not_disclosed ?? 0 },
            ]}
          />
        </ChartCard>

        {periodMix.length > 0 && (
          <ChartCard title="Valid salary postings by pay period" subtitle="Annual vs. hourly" height={220}>
            <DonutChart height={220} centerLabel="Valid" data={periodMix} />
          </ChartCard>
        )}

        <Card title="About missing salary data" subtitle="How the figures above are derived" className={periodMix.length > 0 ? '' : 'lg:col-span-2'}>
          {salary.loading || overview.loading ? (
            <Skeleton className="h-32 w-full" />
          ) : sd && o ? (
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <FileSearch size={16} className="mt-0.5 shrink-0 text-blue-300" />
                <span>
                  <strong className="text-white">{formatNumber(o.salary_not_disclosed)}</strong> of {formatNumber(o.total_jobs ?? o.salary_disclosed + o.salary_not_disclosed)} postings ({formatPercent((o.salary_not_disclosed / (o.salary_disclosed + o.salary_not_disclosed)) * 100)}) do not disclose a salary and are left out of salary statistics.
                </span>
              </li>
              <li className="flex gap-3">
                <FileSearch size={16} className="mt-0.5 shrink-0 text-blue-300" />
                <span>
                  {formatNumber(sd.total_parsed_jobs)} disclosed salaries could be read as a numeric annual or hourly range
                  {unparsed > 0 && <>; {formatNumber(unparsed)} disclosed entries could not be parsed (for example, mixed or unrecognised formats)</>}.
                </span>
              </li>
              <li className="flex gap-3">
                <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />
                <span>
                  {formatNumber(sd.excluded_jobs)} parsed records were excluded by validation (impossible or suspicious ranges), leaving <strong className="text-white">{formatNumber(sd.valid_jobs)}</strong> valid records.
                </span>
              </li>
            </ul>
          ) : (
            <EmptyState title="No data available" />
          )}
        </Card>
      </div>
    </>
  );
}
