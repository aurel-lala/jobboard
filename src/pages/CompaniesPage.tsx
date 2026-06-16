import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Users,
  Star,
  Briefcase,
  Search,
  ExternalLink,
  Globe,
  Calendar,
} from 'lucide-react';
import { buildCompaniesFromJobs } from '@/lib/companies';
import { isJobPubliclyVisible } from '@/lib/jobFilters';
import { getJobs } from '@/services/jobs';
import type { Company } from '@/types';

export default function CompaniesPage() {
  const { id } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    setCompanies(buildCompaniesFromJobs(getJobs()));
  }, []);

  const industries = Array.from(new Set(companies.map((c) => c.industry).filter(Boolean))).sort();

  const filteredCompanies = companies.filter((c) => {
    if (!c?.name || !c?.industry) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q);
    const matchesIndustry = !industryFilter || c.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const selectedCompany = id ? companies.find((company) => company.id === id) : undefined;
  const companyJobs = selectedCompany
    ? getJobs().filter(
        (job) => job.company?.id === selectedCompany.id && isJobPubliclyVisible(job)
      )
    : [];

  if (id) {
    return (
      <div className="min-h-screen bg-[var(--bg-body)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link to="/companies" className="text-sm text-blue-600 hover:underline">
              ← Back to companies
            </Link>
          </div>

          {!selectedCompany ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Company Not Found</h2>
              <p className="text-sm text-slate-500">We couldn't find that company. Please choose another profile.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{selectedCompany.name}</h1>
                  <p className="text-sm text-slate-500 mt-2">{selectedCompany.industry}</p>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold">{selectedCompany.rating} / 5</span>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="mt-2 font-semibold text-slate-900">{selectedCompany.location}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-500">Employees</p>
                  <p className="mt-2 font-semibold text-slate-900">{selectedCompany.size}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-500">Open Roles</p>
                  <p className="mt-2 font-semibold text-slate-900">{selectedCompany.openPositions}</p>
                </div>
              </div>

              <div className="mt-8 prose prose-sm text-slate-600">
                <p>{selectedCompany.description}</p>
              </div>

              <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <a
                  href={`https://${selectedCompany.website.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  Visit website
                  <ExternalLink className="w-4 h-4" />
                </a>
                <span className="text-sm text-slate-500">Founded {selectedCompany.founded}</span>
              </div>

              <div className="mt-10">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Open Roles</h2>
                {companyJobs.length === 0 ? (
                  <p className="text-sm text-slate-500">No open roles are available for this company right now.</p>
                ) : (
                  <div className="grid gap-4">
                    {companyJobs.map((job) => (
                      <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="block rounded-3xl border border-slate-200 p-5 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{job.title}</h3>
                            <p className="text-sm text-slate-500">{job.location}</p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{job.type}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600 line-clamp-2">{job.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{job.status}</span>
                          <span className="text-sm text-slate-500">{job.applicants} applicants</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">

      {/* HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-500">
              Companies
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Explore Companies
          </h1>

          {/* SEARCH */}
          <div className="max-w-xl">
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />

              <input
                type="text"
                placeholder="Search by company name or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {/* INDUSTRY FILTER PILLS */}
          {industries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIndustryFilter('')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  !industryFilter
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {industries.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setIndustryFilter(industryFilter === ind ? '' : ind)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    industryFilter === ind
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* COUNT */}
        <p className="text-sm text-slate-600 mb-5">
          <span className="font-semibold text-slate-900">
            {filteredCompanies.length}
          </span>{' '}
          companies found
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {filteredCompanies.map((company, index) => (
            <div
              key={company.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >

              {/* HEADER */}
              <div className="flex items-start justify-between mb-4">

                <div className="flex items-center gap-3">

                  <div className="w-14 h-14 rounded-xl overflow-hidden border bg-slate-50">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random`;
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {company.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {company.industry}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span className="text-xs font-semibold text-amber-700">
                    {company.rating}
                  </span>
                </div>

              </div>

              {/* DESCRIPTION */}
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {company.description}
              </p>

              {/* DETAILS */}
              <div className="space-y-2 text-sm mb-5">

                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {company.location}
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <Users className="w-4 h-4" />
                  {company.size} employees
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <Briefcase className="w-4 h-4" />
                  {company.openPositions} open positions
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <Globe className="w-4 h-4" />
                  {company.website}
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-4 h-4" />
                  Founded {company.founded}
                </div>

              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">

                <span className="text-xs text-slate-500">
                  {company.reviewCount} reviews
                </span>

                <Link
                  to={`/companies/${company.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600"
                >
                  View Profile
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

              </div>

            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {filteredCompanies.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No companies found
            </h3>
            <p className="text-sm text-slate-500">
              Try adjusting your search criteria.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}