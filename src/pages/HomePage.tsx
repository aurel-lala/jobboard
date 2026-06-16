import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import JobCard from '@/components/jobs/JobCard';
import SearchBar from '@/components/jobs/SearchBar';
import { getJobs } from '@/services/jobs';
import { useAuth } from '@/contexts/AuthContext';
import { filterJobs, isJobPubliclyVisible } from '@/lib/jobFilters';
import type { Job } from '@/types';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || '';

  const { user: currentUser } = useAuth();
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
    setJobs(getJobs());
  }, []);

  const handleSearch = (query: string, location: string) => {
    setFilters(prev => ({ ...prev, query, location }));

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);

    setSearchParams(params);
  };

  const activeJobs = useMemo(() => jobs.filter(isJobPubliclyVisible), [jobs]);

  const filteredJobs = useMemo(
    () =>
      filterJobs(jobs, {
        query: filters.query,
        location: filters.location,
        types: filters.types,
        experience: filters.experience,
        salary: filters.salary,
        remote: filters.remote,
      }),
    [jobs, filters]
  );

  const totalJobs = activeJobs.length;
  const remoteJobs = activeJobs.filter((job) => job.remote).length;
  const uniqueCompanies = Array.from(new Set(activeJobs.map((job) => job.company.name))).length;

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_30%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/10 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Trusted by hiring teams and job seekers
              </span>

              <div>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                  Discover your next career move in minutes.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                  Search the latest jobs, connect with top companies, and apply faster with a modern hiring experience built for candidates and employers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  to="/jobs"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5"
                >
                  Browse Jobs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Create Account
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Career Pulse</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Live job insights</h2>
                </div>
                <div className="rounded-2xl bg-slate-950/70 px-3 py-2 text-sm text-slate-100">Live</div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-3xl bg-slate-900/70 p-4">
                  <p className="text-3xl font-semibold text-white">{totalJobs}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Jobs</p>
                </div>
                <div className="rounded-3xl bg-slate-900/70 p-4">
                  <p className="text-3xl font-semibold text-white">{uniqueCompanies}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Companies</p>
                </div>
                <div className="rounded-3xl bg-slate-900/70 p-4">
                  <p className="text-3xl font-semibold text-white">{remoteJobs}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Remote</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_0.55fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.18em]">Quick Search</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">Search by title, company or location</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-2 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  {filteredJobs.length} results
                </div>
              </div>
              <div className="mt-6">
                <SearchBar
                  onSearch={handleSearch}
                  initialQuery={filters.query}
                  initialLocation={filters.location}
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Featured categories</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Engineering</span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Design</span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Marketing</span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Sales</span>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Why choose JobBoard?</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-4 w-4 text-blue-600" />
                    Curated jobs that match your skills.
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-4 w-4 text-blue-600" />
                    Remote-friendly roles from trusted companies.
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-4 w-4 text-blue-600" />
                    Fast, modern search and apply flow.
                  </li>
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Latest jobs</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Recommended for you</h3>
                </div>
                <Link to="/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  View all jobs
                </Link>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {filteredJobs.slice(0, 4).map((job, index) => (
                    <JobCard key={job.id} job={job} variant="compact" index={index} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  No job data is available yet. Add listings to see the latest roles.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Top statistics</h3>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm text-slate-500">Open roles</p>
                    <p className="text-xl font-semibold text-slate-900">{totalJobs}</p>
                  </div>
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm text-slate-500">Remote options</p>
                    <p className="text-xl font-semibold text-slate-900">{remoteJobs}</p>
                  </div>
                  <span className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Remote</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm text-slate-500">Hiring companies</p>
                    <p className="text-xl font-semibold text-slate-900">{uniqueCompanies}</p>
                  </div>
                  <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700">Trusted</span>
                </div>
              </div>
            </div>

            {!currentUser && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Get started</h3>
                <p className="mt-3 text-sm text-slate-500">
                  Save jobs, apply instantly, and build your profile to stand out.
                </p>
                <div className="mt-6 grid gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Create account
                  </Link>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Browse jobs
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
