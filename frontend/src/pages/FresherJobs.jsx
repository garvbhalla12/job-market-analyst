import { useState } from 'react';
import { GraduationCap, Layers, Percent, Sprout } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Notice from '../components/common/Notice';
import { ErrorState } from '../components/common/States';
import ChartCard from '../components/charts/ChartCard';
import DonutChart from '../components/charts/DonutChart';
import JobsTable from '../components/jobs/JobsTable';
import useApi from '../hooks/useApi';
import analyticsService from '../services/analyticsService';
import { formatNumber, formatPercent } from '../utils/format';

const KEYWORD_CHIPS = ['junior', 'graduate', 'associate', 'trainee', 'entry level', 'fresher'];
const LISTING_LIMIT = 30;

export default function FresherJobs() {
  const fresher = useApi((s) => analyticsService.fresher(s), []);
  const employment = useApi((s) => analyticsService.employment(s), []);
  const [activeKey, setActiveKey] = useState(null);

  // The exact employment-type label for internships comes from the data itself.
  const internshipLabel = employment.data?.employment_distribution?.find((e) => /intern/i.test(e.employment_type))?.employment_type;

  const chips = [
    ...(internshipLabel ? [{ key: 'internships', label: 'Internships', params: { employment_type: internshipLabel } }] : []),
    ...KEYWORD_CHIPS.map((kw) => ({ key: kw, label: kw.replace(/^./, (c) => c.toUpperCase()), params: { search: kw } })),
  ];
  const active = chips.find((c) => c.key === activeKey) || chips[0];

  const listingsReady = !employment.loading; // wait so the default chip is stable
  const listings = useApi(
    (s) => analyticsService.jobs({ ...active.params, limit: LISTING_LIMIT }, s),
    [active.key, internshipLabel],
    { enabled: listingsReady },
  );

  const f = fresher.data;
  const others = f ? Math.max(0, f.total_jobs - f.fresher_jobs) : 0;

  return (
    <>
      <PageHeader
        title="Fresher jobs"
        description="Potential entry-level and internship opportunities in the collected postings."
      />

      <Notice tone="warn" className="mb-6">
        <strong>Potential fresher opportunities, not verified eligibility.</strong> A posting is flagged when its title or description contains keywords such as fresher, entry level, junior, graduate, new grad, trainee, associate or early career. Broad terms like &ldquo;associate&rdquo; can match roles that are not truly entry-level, so always read the full posting.
      </Notice>

      {fresher.error ? (
        <Card className="mb-6">
          <ErrorState message={fresher.error} onRetry={fresher.reload} compact />
        </Card>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Potential fresher postings" value={formatNumber(f?.fresher_jobs)} hint={f ? `${formatPercent(f.fresher_percentage)} of postings` : undefined} icon={GraduationCap} accent="purple" loading={fresher.loading} />
          <StatCard label="Internship postings" value={formatNumber(f?.internship_jobs)} hint={f ? `${formatPercent(f.internship_percentage)} of postings` : undefined} icon={Sprout} accent="cyan" loading={fresher.loading} />
          <StatCard label="Fresher + internship" value={formatNumber(f?.fresher_and_internship_overlap)} hint="Flagged postings that are also internships" icon={Layers} accent="blue" loading={fresher.loading} />
          <StatCard label="Total postings analysed" value={formatNumber(f?.total_jobs)} hint="Sample dataset" icon={Percent} accent="slate" loading={fresher.loading} />
        </div>
      )}

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Potential fresher share"
          subtitle="Flagged postings vs. all other postings"
          loading={fresher.loading}
          error={fresher.error}
          onRetry={fresher.reload}
          empty={!f}
          height={220}
        >
          <DonutChart
            height={220}
            centerLabel="Jobs"
            data={[
              { name: 'Potential fresher', value: f?.fresher_jobs ?? 0 },
              { name: 'Other postings', value: others },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Employment type distribution"
          subtitle="All postings by employment type"
          loading={employment.loading}
          error={employment.error}
          onRetry={employment.reload}
          empty={!employment.data?.employment_distribution?.length}
          height={220}
        >
          <DonutChart
            height={220}
            innerRadius={0}
            data={(employment.data?.employment_distribution || []).map((e) => ({ name: e.employment_type, value: e.job_count, percentage: e.percentage }))}
          />
        </ChartCard>
      </div>

      <Card
        title="Relevant job listings"
        subtitle={
          listings.data
            ? `${formatNumber(listings.data.total_results)} matching postings · showing up to ${LISTING_LIMIT}`
            : 'Filtered through the Job Explorer API'
        }
        bodyClassName="!p-0"
      >
        <div className="flex flex-wrap gap-2 border-b border-white/[0.06] px-5 py-3">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActiveKey(chip.key)}
              aria-pressed={active.key === chip.key}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                active.key === chip.key
                  ? 'bg-brand-purple/20 text-violet-200 ring-brand-purple/50'
                  : 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <p className="px-5 pt-3 text-xs text-slate-500">
          Keyword chips search job titles and company names; the Internships chip filters by employment type. Descriptions are not shown by the API.
        </p>
        {listings.error ? (
          <ErrorState message={listings.error} onRetry={listings.reload} compact />
        ) : (
          <JobsTable
            jobs={listings.data?.jobs}
            loading={listings.loading || !listingsReady}
            emptyTitle="No postings for this filter"
            emptyDescription="Try another keyword above."
          />
        )}
      </Card>
    </>
  );
}
