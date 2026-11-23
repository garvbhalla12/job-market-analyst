import { useState } from 'react';
import { Globe2, MapPin, Trophy } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Notice from '../components/common/Notice';
import LimitSelect from '../components/common/LimitSelect';
import { EmptyState, ErrorState, Skeleton } from '../components/common/States';
import ChartCard from '../components/charts/ChartCard';
import HBarChart from '../components/charts/HBarChart';
import RankedList from '../components/dashboard/RankedList';
import useApi from '../hooks/useApi';
import analyticsService from '../services/analyticsService';
import { formatNumber, formatPercent } from '../utils/format';

export default function LocationAnalytics() {
  const [limit, setLimit] = useState(15);
  const { data, loading, error, reload } = useApi((s) => analyticsService.locations(limit, s), [limit]);

  const rows = data?.top_locations || [];
  const top = rows[0];
  const chartHeight = Math.max(340, rows.length * 30);

  return (
    <>
      <PageHeader
        title="Location analytics"
        description="Where the collected job postings are concentrated."
        actions={<LimitSelect value={limit} onChange={setLimit} label="Show top" options={[10, 15, 25, 50]} />}
      />

      <Notice className="mb-6">
        Locations are shown exactly as listed in the postings and are not merged. Some postings only give a broad area such as &ldquo;United States&rdquo;, so those entries do not point to a specific city.
      </Notice>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Unique locations" value={formatNumber(data?.total_unique_locations)} hint="Distinct location labels" icon={MapPin} accent="purple" loading={loading && !data} />
        <StatCard label="Top location" value={top?.location ?? '—'} hint={top ? `${formatNumber(top.job_count)} postings (${formatPercent(top.percentage)})` : undefined} icon={Trophy} accent="blue" loading={loading && !data} />
        <StatCard label="Broad-location postings" value={formatNumber(data?.broad_location_jobs)} hint="Listed only as a country or state-level area" icon={Globe2} accent="cyan" loading={loading && !data} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="Top hiring locations"
          subtitle="Number of postings per location"
          loading={loading}
          error={error}
          onRetry={reload}
          empty={!rows.length}
          height={chartHeight}
        >
          <HBarChart height={chartHeight} labelWidth={160} data={rows.map((r) => ({ name: r.location, value: r.job_count, percentage: r.percentage }))} />
        </ChartCard>

        <Card className="lg:col-span-2" title="Location ranking" subtitle="Share of all postings">
          {error ? (
            <ErrorState message={error} onRetry={reload} compact />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No location data available" />
          ) : (
            <RankedList rows={rows.map((r) => ({ name: r.location, count: r.job_count, percentage: r.percentage }))} countLabel="jobs" />
          )}
        </Card>
      </div>
    </>
  );
}
