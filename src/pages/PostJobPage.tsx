import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { saveJob } from '@/services/jobs';
import { useAuth } from '@/contexts/AuthContext';
import type { Job } from '@/types';

const DRAFT_KEY = 'jobconnect_post_job_draft';

export default function PostJobPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load draft from localStorage on first render
  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const draft = loadDraft();
  const [title, setTitle] = useState(draft?.title ?? '');
  const [company, setCompany] = useState(draft?.company ?? '');
  const [location, setLocation] = useState(draft?.location ?? '');
  const [type, setType] = useState<Job['type']>(draft?.type ?? 'full-time');
  const [isRemote, setIsRemote] = useState(draft?.isRemote ?? false);
  const [salaryMin, setSalaryMin] = useState(draft?.salaryMin ?? '');
  const [salaryMax, setSalaryMax] = useState(draft?.salaryMax ?? '');
  const [description, setDescription] = useState(draft?.description ?? '');
  const [companyProfile, setCompanyProfile] = useState<Job['company'] | null>(null);
  const [hasDraft, setHasDraft] = useState(!!draft);

  useEffect(() => {
    if (!user || user.role !== 'employer') {
      navigate('/login');
      return;
    }

    if (user.company) {
      setCompanyProfile(user.company);
      // Only pre-fill from company if no draft
      if (!hasDraft) {
        setCompany(user.company.name);
        setLocation(user.company.location);
      }
    }
  }, [navigate, user]);

  // Auto-save draft whenever form fields change
  useEffect(() => {
    const draft = { title, company, location, type, isRemote, salaryMin, salaryMax, description };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, company, location, type, isRemote, salaryMin, salaryMax, description]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || user.role !== 'employer') {
      navigate('/login');
      return;
    }

    const companyInfo = user.company ?? companyProfile;
    const jobCompany: Job['company'] = companyInfo
      ? {
          ...companyInfo,
          openPositions: Math.max(1, companyInfo.openPositions ?? 1),
        }
      : {
          id: `company-${Date.now()}`,
          name: company.trim() || 'Unknown Company',
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(company.trim() || 'Company')}&background=random`,
          industry: 'Technology',
          size: '51-200' as const,
          website: '#',
          description: `Jobs at ${company.trim() || 'Unknown Company'}`,
          location: location.trim() || 'Remote',
          founded: 2020,
          rating: 4.5,
          reviewCount: 0,
          openPositions: 1,
        } as Job['company'];

    const normalizedLocation = location.trim() || 'Remote';
    const minSalary = Number(salaryMin) > 0 ? Number(salaryMin) : 0;
    const maxSalary = Number(salaryMax) > 0 ? Math.max(minSalary, Number(salaryMax)) : minSalary;

    const job: Job = {
      id: `job-${Date.now()}`,
      title: title.trim() || 'Untitled Role',
      company: jobCompany,
      location: normalizedLocation,
      type: type as Job['type'],
      salary: {
        min: minSalary,
        max: maxSalary,
        currency: 'USD',
        period: 'year',
      },
      description: description.trim() || 'No description provided.',
      requirements: [],
      responsibilities: [],
      benefits: [],
      skills: [],
      experienceLevel: 'mid',
      postedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      applicants: 0,
      featured: false,
      remote: isRemote || normalizedLocation.toLowerCase().includes('remote'),
      status: 'active',
      postedById: user.id,
      views: 0,
    };

    saveJob(job);
    clearDraft();
    toast.success('Job published successfully');
    navigate('/employer/dashboard', { state: { refresh: true } });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Post a New Job</h1>
            <p className="mt-2 text-sm text-slate-500">
              Fill in the details below to create a new job listing.
            </p>
            {hasDraft && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Draft restored.</span> Your unsaved progress has been loaded.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft();
                    setTitle(''); setLocation(''); setType('full-time');
                    setIsRemote(false); setSalaryMin(''); setSalaryMax(''); setDescription('');
                    if (user?.company) { setCompany(user.company.name); setLocation(user.company.location); }
                  }}
                  className="ml-4 text-sm text-amber-700 underline hover:text-amber-900"
                >
                  Discard draft
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Job Title
                <input
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Senior Product Designer"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Company
                <input
                  value={company}
                  onChange={event => setCompany(event.target.value)}
                  disabled={!!companyProfile}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="e.g. Studio Labs"
                />
                {companyProfile && (
                  <p className="text-xs text-slate-500 mt-1">Using your saved company profile.</p>
                )}
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Location
                <input
                  value={location}
                  onChange={event => setLocation(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Remote, London, New York"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Job Type
                <select
                  value={type}
                  onChange={event => setType(event.target.value as Job['type'])}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(event) => setIsRemote(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Remote-friendly role
            </label>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Minimum salary
                <input
                  type="number"
                  min="0"
                  value={salaryMin}
                  onChange={event => setSalaryMin(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Maximum salary
                <input
                  type="number"
                  min="0"
                  value={salaryMax}
                  onChange={event => setSalaryMax(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0"
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              Job Description
              <textarea
                value={description}
                onChange={event => setDescription(event.target.value)}
                className="min-h-[180px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Write a brief description of the role, responsibilities, and requirements."
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => navigate('/employer/dashboard')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Publish Job
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}