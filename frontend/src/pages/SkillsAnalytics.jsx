import { useState } from 'react';
import { Code2, Flame, Layers } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Notice from '../components/common/Notice';
import LimitSelect from '../components/common/LimitSelect';
import { EmptyState, ErrorState, Skeleton } from '../components/common/States';
import ChartCard from '../components/charts/ChartCard';
import HBarChart from '../components/charts/HBarChart';
import VBarChart from '../components/charts/VBarChart';
import RankedList from '../components/dashboard/RankedList';
import useApi from '../hooks/useApi';
import analyticsService from '../services/analyticsService';
import { formatNumber, formatPercent } from '../utils/format';

export default function SkillsAnalytics() {
  const [limit, setLimit] = useState(15);
  const { data, loading, error, reload } = useApi((s) => analyticsService.skills(limit, s), [limit]);

  const skills = data || [];
  const top = skills[0];
  const picker = <LimitSelect value={limit} onChange={setLimit} />;

  return (
    <>
      <PageHeader
        title="Skills analytics"
        description="Which technical skills appear most often in the collected job postings."
        actions={picker}
      />

      <Notice className="mb-6">
        Percentages show the share of <em>all</em> postings that mention a skill. Postings usually list several skills, so the values are not meant to add up to 100%.
      </Notice>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Most in-demand skill" value={top?.skill ?? '—'} hint={top ? `${formatNumber(top.job_count)} postings` : undefined} icon={Flame} accent="purple" loading={loading && !data} />
        <StatCard label="Share of postings" value={top ? formatPercent(top.demand_percentage) : '—'} hint="Top skill's share of all postings" icon={Code2} accent="blue" loading={loading && !data} />
        <StatCard label="Skills shown" value={formatNumber(skills.length)} hint={`Top ${limit} requested`} icon={Layers} accent="cyan" loading={loading && !data} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Skill demand (job count)"
          subtitle="Postings mentioning each skill"
          loading={loading}
          error={error}
          onRetry={reload}
          empty={!skills.length}
          height={Math.max(320, skills.length * 30)}
        >
          <HBarChart
            height={Math.max(320, skills.length * 30)}
            labelWidth={110}
            data={skills.map((s) => ({ name: s.skill, value: s.job_count, percentage: s.demand_percentage }))}
          />
        </ChartCard>

        <ChartCard
          title="Skills comparison (% of postings)"
          subtitle="Relative demand across the selected skills"
          loading={loading}
          error={error}
          onRetry={reload}
          empty={!skills.length}
          height={Math.max(320, skills.length * 30)}
        >
          <VBarChart
            height={Math.max(320, skills.length * 30)}
            valueLabel="Share"
            formatValue={(v) => `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })}%`}
            data={skills.map((s) => ({ name: s.skill, value: s.demand_percentage, percentage: s.demand_percentage }))}
            labelMax={10}
            angle={-45}
          />
        </ChartCard>
      </div>

      <Card className="mt-4" title="Skill demand ranking" subtitle="Ordered by number of postings">
        {error ? (
          <ErrorState message={error} onRetry={reload} compact />
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <EmptyState title="No skill data available" />
        ) : (
          <RankedList rows={skills.map((s) => ({ name: s.skill, count: s.job_count, percentage: s.demand_percentage }))} countLabel="postings" />
        )}
      </Card>
    </>
  );
}
