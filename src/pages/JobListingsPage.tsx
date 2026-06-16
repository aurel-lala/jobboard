import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';

import JobCard from '@/components/jobs/JobCard';
import SearchBar from '@/components/jobs/SearchBar';
import { getJobs } from '@/services/jobs';
import { useAuth } from '@/contexts/AuthContext';
import { filterJobs } from '@/lib/jobFilters';
import type { Job } from '@/types';

export default function JobListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const initialQuery = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || '';
  const initialSavedView = searchParams.get('saved') === 'true';

  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);

  const [filters, setFilters] = useState({
    query: initialQuery,
    location: initialLocation,
    types: [] as string[],
    experience: [] as string[],
    salary: null as { min: number; max: number } | null,
    remote: false,
  });

  useEffect(() => {
    const data: Job[] = getJobs();
    setJobs(data);
  }, []);

  const EMPTY_FILTERS = {
    query: '',
    location: '',
    types: [] as string[],
    experience: [] as string[],
    salary: null as { min: number; max: number } | null,
    remote: false,
  };

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.experience.length > 0 ||
    filters.salary !== null ||
    filters.remote;

  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS, query: filters.query, location: filters.location });
    setSearchParams(new URLSearchParams());
  };

  const toggleType = (type: string) =>
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));

  const toggleExperience = (level: string) =>
    setFilters((prev) => ({
      ...prev,
      experience: prev.experience.includes(level)
        ? prev.experience.filter((e) => e !== level)
        : [...prev.experience, level],
    }));

  const handleSearch = (query: string, location: string) => {
    setFilters(prev => ({ ...prev, query, location }));

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    if (initialSavedView) params.set('saved', 'true');

    setSearchParams(params);
  };

  const filteredJobs = useMemo(
    () =>
      filterJobs(jobs, {
        query: filters.query,
        location: filters.location,
        types: filters.types,
        experience: filters.experience,
        salary: filters.salary,
        remote: filters.remote,
        savedOnly: initialSavedView,
        savedJobIds: user?.savedJobs,
      }),
    [jobs, filters, initialSavedView, user?.savedJobs]
  );

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-500">
              Job Listings
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Find Your Perfect Job
          </h1>

          <SearchBar
            onSearch={handleSearch}
            initialQuery={filters.query}
            initialLocation={filters.location}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-6">

          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-3">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="rounded-full bg-blue-600 text-white text-xs font-bold px-2 py-0.5">
                    {filters.types.length + filters.experience.length + (filters.salary ? 1 : 0) + (filters.remote ? 1 : 0)}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              )}
            </div>

            {filtersOpen && (
              <div className="border-t border-slate-100 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Job Type */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Job Type</p>
                  <div className="space-y-2">
                    {(['full-time','part-time','contract','freelance','internship'] as const).map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.types.includes(t)}
                          onChange={() => toggleType(t)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 capitalize">{t.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Experience</p>
                  <div className="space-y-2">
                    {(['entry','mid','senior','lead','executive'] as const).map((lvl) => (
                      <label key={lvl} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.experience.includes(lvl)}
                          onChange={() => toggleExperience(lvl)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 capitalize">{lvl}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Salary */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Salary (yearly $)</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500">Min</label>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={filters.salary?.min ?? ''}
                        onChange={(e) => {
                          const min = parseInt(e.target.value) || 0;
                          setFilters((prev) => ({
                            ...prev,
                            salary: { min, max: prev.salary?.max ?? 300000 },
                          }));
                        }}
                        placeholder="0"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Max</label>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={filters.salary?.max ?? ''}
                        onChange={(e) => {
                          const max = parseInt(e.target.value) || 300000;
                          setFilters((prev) => ({
                            ...prev,
                            salary: { min: prev.salary?.min ?? 0, max },
                          }));
                        }}
                        placeholder="300000"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    {filters.salary && (
                      <button
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, salary: null }))}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Clear salary filter
                      </button>
                    )}
                  </div>
                </div>

                {/* Remote */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Work Mode</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.remote}
                      onChange={(e) => setFilters((prev) => ({ ...prev, remote: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Remote only</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {filteredJobs.length}
                </span>{' '}
                jobs found
              </p>
            </div>

            {filteredJobs.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 xl:grid-cols-2 gap-4'
                    : 'space-y-3'
                }
              >
                {filteredJobs.map((job, index) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    variant={viewMode === 'list' ? 'compact' : 'default'}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">No jobs match your search</h3>
                <p className="text-sm text-slate-500 max-w-xl mx-auto">
                  Try broadening your search terms, remove filters, or create a job posting if you are hiring.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFilters({
                      query: '',
                      location: '',
                      types: [],
                      experience: [],
                      salary: null,
                      remote: false,
                    })}
                    className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Reset filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchParams({})}
                    className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}