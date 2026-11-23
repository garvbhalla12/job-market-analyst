import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, Globe, Wallet } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Notice from '../components/common/Notice';
import { ErrorState } from '../components/common/States';
import ChartCard from '../components/charts/ChartCard';
import HBarChart from '../components/charts/HBarChart';
import DonutChart from '../components/charts/DonutChart';
import JobsTable from '../components/jobs/JobsTable';
import useApi from '../hooks/useApi';
import analyticsService from '../services/analyticsService';
import { formatNumber, formatPercent } from '../utils/format';

export default function Dashboard() {
  const overview = useApi((s) => analyticsService.overview(s), []);
  const skills = useApi((s) => analyticsService.skills(10, s), []);
  const workplace = useApi((s) => analyticsService.workplace(s), []);
  const employment = useApi((s) => analyticsService.employment(s), []);
  const locations = useApi((s) => analyticsService.locations(8, s), []);
  const companies = useApi((s) => analyticsService.companies(8, s), []);
  const roles = useApi((s) => analyticsService.roles(s), []);
  const recent = useApi((s) => analyticsService.jobs({ limit: 8 }, s), []);

  const o = overview.data;
  const total = o?.total_jobs;
  const remoteKey = o ? Object.keys(o.workplace_distribution || {}).find((k) => k.trim().toLowerCase() === 'remote') : null;
  const remoteJobs = o ? (remoteKey ? o.workplace_distribution[remoteKey] : 0) : null;
  const pct = (n) => (total ? formatPercent((n / total) * 100) : undefined);

  return (
    <>
      <PageHeader
        title="Job market overview"
        description="A snapshot of demand, hiring locations, companies and workplace trends across the collected postings."
      />

      <Notice className="mb-6">
        {total ? (
          <>This dashboard analyses a collected sample of <strong>{formatNumber(total)}</strong> job postings. It does not represent the entire job market.</>
        ) : (
          <>This dashboard analyses a collected sample of job postings. It does not represent the entire job market.</>
        )}
      </Notice>

      {overview.error ? (
        <Card className="mb-6">
          <ErrorState message={overview.error} onRetry={overview.reload} compact />
        </Card>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total jobs" value={formatNumber(total)} icon={Briefcase} accent="purple" loading={overview.loading} />
          <StatCard label="Total companies" value={formatNumber(o?.total_companies)} hint="Excludes unknown companies" icon={Building2} accent="blue" loading={overview.loading} />
          <StatCard
            label="Jobs with disclosed salary"
            value={formatNumber(o?.salary_disclosed)}
            hint={o ? `${pct(o.salary_disclosed)} of postings` : undefined}
            icon={Wallet}
            accent="cyan"
            loading={overview.loading}
          />
          <StatCard
            label="Remote jobs"
            value={formatNumber(remoteJobs)}
            hint={o ? `${pct(remoteJobs)} of postings` : undefined}
            icon={Globe}
            accent="purple"
            loading={overview.loading}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Most in-demand skills"
          subtitle="Number of postings that mention each skill"
          loading={skills.loading}
          error={skills.error}
          onRetry={skills.reload}
          empty={!skills.data?.length}
          height={340}
        >
          <HBarChart height={340} labelWidth={110} data={(skills.data || []).map((s) => ({ name: s.skill, value: s.job_count, percentage: s.demand_percentage }))} />
        </ChartCard>

        <ChartCard
          title="Workplace distribution"
          subtitle="Remote, hybrid and on-site postings"
          loading={workplace.loading}
          error={workplace.error}
          onRetry={workplace.reload}
          empty={!workplace.data?.workplace_distribution?.length}
          height={240}
        >
          <DonutChart
            centerLabel="Jobs"
            data={(workplace.data?.workplace_distribution || []).map((w) => ({ name: w.workplace_type, value: w.job_count, percentage: w.percentage }))}
          />
        </ChartCard>

        <ChartCard
          title="Employment type distribution"
          subtitle="Share of postings by employment type"
          loading={employment.loading}
          error={employment.error}
          onRetry={employment.reload}
          empty={!employment.data?.employment_distribution?.length}
          height={240}
        >
          <DonutChart
            innerRadius={0}
            data={(employment.data?.employment_distribution || []).map((e) => ({ name: e.employment_type, value: e.job_count, percentage: e.percentage }))}
          />
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Job role distribution"
          subtitle="Postings grouped by role category (keyword-based on job titles)"
          loading={roles.loading}
          error={roles.error}
          onRetry={roles.reload}
          empty={!roles.data?.role_distribution?.length}
          height={380}
        >
          <HBarChart height={380} labelWidth={170} data={(roles.data?.role_distribution || []).map((r) => ({ name: r.category, value: r.job_count, percentage: r.percentage }))} />
        </ChartCard>

        <ChartCard
          title="Top job locations"
          subtitle="Locations with the most postings"
          loading={locations.loading}
          error={locations.error}
          onRetry={locations.reload}
          empty={!locations.data?.top_locations?.length}
          height={320}
        >
          <HBarChart height={320} labelWidth={130} data={(locations.data?.top_locations || []).map((l) => ({ name: l.location, value: l.job_count, percentage: l.percentage }))} />
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Most active companies"
          subtitle="Companies with the most postings"
          loading={companies.loading}
          error={companies.error}
          onRetry={companies.reload}
          empty={!companies.data?.top_companies?.length}
          height={320}
        >
          <HBarChart height={320} labelWidth={150} data={(companies.data?.top_companies || []).map((c) => ({ name: c.company, value: c.job_count, percentage: c.percentage }))} />
        </ChartCard>
      </div>

      <Card
        className="mt-4"
        title="Recent job postings"
        subtitle="First postings returned by the Job Explorer API"
        bodyClassName="!p-0"
        action={
          <Link to="/jobs" className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200">
            Open Job Explorer <ArrowRight size={13} />
          </Link>
        }
      >
        {recent.error ? (
          <ErrorState message={recent.error} onRetry={recent.reload} compact />
        ) : (
          <JobsTable jobs={recent.data?.jobs} loading={recent.loading} rows={5} emptyTitle="No job postings found" emptyDescription="The dataset returned no postings." />
        )}
      </Card>
    </>
  );
}
