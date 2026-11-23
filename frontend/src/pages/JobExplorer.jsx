import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import { ErrorState, Spinner } from '../components/common/States';
import JobsTable from '../components/jobs/JobsTable';
import useApi from '../hooks/useApi';
import useDebounce from '../hooks/useDebounce';
import analyticsService from '../services/analyticsService';
import { formatNumber } from '../utils/format';

const LIMITS = [25, 50, 100]; // backend accepts 1-100

export default function JobExplorer() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(urlSearch);
  const [location, setLocation] = useState('');
  const [workplaceType, setWorkplaceType] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [limit, setLimit] = useState(50);

  // Keep the box in sync when the top-bar quick search navigates here.
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  const dSearch = useDebounce(search, 350);
  const dLocation = useDebounce(location, 350);

  // Filter options come from the real data, not hard-coded values.
  const workplace = useApi((s) => analyticsService.workplace(s), []);
  const employment = useApi((s) => analyticsService.employment(s), []);
  const workplaceOptions = (workplace.data?.workplace_distribution || []).map((w) => w.workplace_type).filter((v) => v !== 'Not Specified');
  const employmentOptions = (employment.data?.employment_distribution || []).map((e) => e.employment_type).filter((v) => v !== 'Not Specified');

  const jobs = useApi(
    (s) =>
      analyticsService.jobs(
        { search: dSearch.trim(), location: dLocation.trim(), workplace_type: workplaceType, employment_type: employmentType, limit },
        s,
      ),
    [dSearch, dLocation, workplaceType, employmentType, limit],
  );

  const hasFilters = Boolean(search || location || workplaceType || employmentType);
  const clear = () => {
    setSearch('');
    setLocation('');
    setWorkplaceType('');
    setEmploymentType('');
  };

  const result = jobs.data;
  const pending = search !== dSearch || location !== dLocation;

  return (
    <>
      <PageHeader title="Job explorer" description="Search the collected postings and combine filters to narrow them down." />

      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="job-search" className="label">Title or company</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input id="job-search" className="input !pl-9" placeholder="e.g. React developer, Google" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="job-location" className="label">Location</label>
            <input id="job-location" className="input" placeholder="e.g. California" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label htmlFor="job-workplace" className="label">Workplace type</label>
            <select id="job-workplace" className="input" value={workplaceType} onChange={(e) => setWorkplaceType(e.target.value)}>
              <option value="">All workplace types</option>
              {workplaceOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="job-employment" className="label">Employment type</label>
            <select id="job-employment" className="input" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              <option value="">All employment types</option>
              {employmentOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Results per request
            <select className="input !w-auto !py-1.5" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {LIMITS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={clear} disabled={!hasFilters} className="btn-ghost">
            <X size={14} /> Clear filters
          </button>
        </div>
      </Card>

      <Card
        title="Results"
        subtitle={
          result
            ? `Showing ${formatNumber(result.returned_results)} of ${formatNumber(result.total_results)} matching postings`
            : 'Loading postings…'
        }
        action={(jobs.loading || pending) && result ? <Spinner /> : null}
        bodyClassName="!p-0"
      >
        {jobs.error ? (
          <ErrorState message={jobs.error} onRetry={jobs.reload} />
        ) : (
          <>
            <JobsTable
              jobs={result?.jobs}
              loading={jobs.loading && !result}
              emptyTitle={hasFilters ? 'No jobs match your filters' : 'No jobs found'}
              emptyDescription={hasFilters ? 'Try different keywords or clear your filters.' : 'The dataset returned no postings.'}
            />
            {result && result.total_results > result.returned_results && (
              <p className="border-t border-white/[0.06] px-5 py-3 text-xs text-slate-400">
                {formatNumber(result.total_results - result.returned_results)} more postings match. Refine your search or filters to see them (this API does not support paging).
              </p>
            )}
          </>
        )}
      </Card>
    </>
  );
}
