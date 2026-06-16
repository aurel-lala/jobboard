import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  UserCheck,
  Plus,
  Eye,
  ClipboardList,
  Trash2,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Building2,
  TrendingUp,
} from 'lucide-react';

import {
  getCurrentUser,
  getUserById,
  getUsers,
  updateUser,
  updateUserById,
  updateUserApplicationStatus,
  addInterviewToUser,
} from '@/services/auth';
import {
  extendOfferToCandidate,
  notifyCandidateOfStatusChange,
} from '@/services/applications';
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  normalizeApplicationStatus,
} from '@/lib/applicationStatus';
import { getJobs, deleteJob } from '@/services/jobs';
import type { ApplicationProfileSnapshot, ApplicationStatus, Job, User, Company } from '@/types';

/* =========================
   TYPES
========================= */
interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalApplicants: number;
  newApplicants: number;
  views: number;
  inPipeline: number;
  offers: number;
  hired: number;
}

interface ApplicationItem {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId: string;
  appliedAt: string;
  coverLetter?: string;
  status: ApplicationStatus;
  profileSnapshot?: ApplicationProfileSnapshot;
}

const APPLICATION_FILTERS = [
  'all',
  'pending',
  'reviewing',
  'interview_scheduled',
  'interviewed',
  'offer',
  'hired',
  'rejected',
  'declined',
] as const;

type ApplicationFilter = (typeof APPLICATION_FILTERS)[number];

/* =========================
   COMPONENT
========================= */
function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      title="Copy email"
    >
      {email}
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        : <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
      }
    </button>
  );
}

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get('tab') as 'applications' | 'listings' | null;
  const activeTab = tab === 'applications' ? 'applications' : tab === 'listings' ? 'listings' : 'dashboard';
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<Company | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState('');
  const [allApplications, setAllApplications] = useState<ApplicationItem[]>([]);
  const [applicationFilter, setApplicationFilter] = useState<ApplicationFilter>('all');
  const [schedulingApplication, setSchedulingApplication] = useState<ApplicationItem | null>(null);
  const [viewingProfile, setViewingProfile] = useState<ApplicationItem | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [expandedApplication, setExpandedApplication] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const refreshEmployerData = () => {
    const current = getCurrentUser();
    if (!current || current.role !== 'employer') {
      navigate('/login');
      return;
    }

    const storedJobs = getJobs();
    const employerJobs = storedJobs.filter((job) => job.postedById === current.id);
    const oneWeekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

    const candidates = getUsers().filter((u) => u.role === 'candidate');

    const applicationItems: ApplicationItem[] = candidates.flatMap((candidate) => {
      const apps = candidate.applications ?? [];
      return apps
        .filter((app) => employerJobs.some((job) => job.id === app.jobId))
        .map((app) => {
          const job = employerJobs.find((j) => j.id === app.jobId);
          return {
            applicationId: app.id,
            candidateId: candidate.id,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            candidateEmail: candidate.email,
            jobTitle: job?.title ?? '(Position filled)',
            jobId: app.jobId,
            appliedAt: app.appliedAt,
            coverLetter: app.coverLetter,
            status: normalizeApplicationStatus(app.status),
            profileSnapshot: app.profileSnapshot,
          };
        });
    });

    const totalApplicants = applicationItems.length;
    const newApplicants = applicationItems.filter(
      (item) => new Date(item.appliedAt) >= oneWeekAgo
    ).length;
    const inPipeline = applicationItems.filter((item) =>
      ['interview_scheduled', 'interviewed'].includes(item.status)
    ).length;
    const offers = applicationItems.filter((item) => item.status === 'offer').length;
    const hired = applicationItems.filter((item) => item.status === 'hired').length;
    const views = employerJobs.reduce((sum, job) => sum + (job.views ?? 0), 0);

    const defaultCompany: Company = {
      id: `company-${current.id}`,
      name: '',
      industry: '',
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${current.firstName} ${current.lastName}`)}&background=random`,
      description: '',
      location: '',
      size: '1-10',
      openPositions: 0,
      website: '',
      founded: new Date().getFullYear(),
      rating: 0,
      reviewCount: 0,
    };

    const existingCompany = current.company ?? employerJobs[0]?.company ?? defaultCompany;

    setUser(current);
    setCompany(existingCompany);
    setCompanyForm(existingCompany);
    setJobs(employerJobs);
    setAllApplications(
      applicationItems.sort(
        (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      )
    );
    const activeJobCount = employerJobs.filter((job) => job.status === 'active').length;

    // Update company openPositions dynamically
    if (existingCompany.id) {
      existingCompany.openPositions = activeJobCount;
    }

    setStats({
      totalJobs: employerJobs.length,
      activeJobs: activeJobCount,
      totalApplicants,
      newApplicants,
      views,
      inPipeline,
      offers,
      hired,
    });
  };

  useEffect(() => {
    refreshEmployerData();
  }, [navigate, location.key, location.state]);

  // ── Company ──────────────────────────────────────────────────────────────────

  const handleCompanyFieldChange = (field: keyof Company, value: string | number) => {
    if (!companyForm) return;
    setCompanyForm({ ...companyForm, [field]: value });
  };

  const saveCompanyProfile = () => {
    if (!companyForm) return;
    const updatedUser = updateUser({ company: companyForm });
    if (updatedUser) {
      setCompany(companyForm);
      setUser(updatedUser);
      setCompanyMessage('Company profile updated successfully.');
      setIsEditingCompany(false);
    } else {
      setCompanyMessage('Unable to save company profile.');
    }
  };

  // ── Application actions ──────────────────────────────────────────────────────

  const handleStatusChange = (
    application: ApplicationItem,
    status: 'reviewing' | 'rejected'
  ) => {
    if (
      status === 'rejected' &&
      !window.confirm(`Reject ${application.candidateName} for ${application.jobTitle}?`)
    ) {
      return;
    }

    const updated = updateUserApplicationStatus(
      application.candidateId,
      application.applicationId,
      status
    );
    if (!updated) return;

    notifyCandidateOfStatusChange(
      application.candidateId,
      status,
      application.jobTitle
    );

    refreshEmployerData();
  };

  const handleScheduleInterview = (application: ApplicationItem) => {
    if (!interviewDate || !interviewTime) return;

    const scheduledAt = new Date(`${interviewDate}T${interviewTime}`).toISOString();

    updateUserApplicationStatus(
      application.candidateId,
      application.applicationId,
      'interview_scheduled'
    );
    addInterviewToUser(application.candidateId, {
      id: `interview-${Date.now()}`,
      jobId: application.jobId,
      companyName: company?.name || 'Company',
      scheduledAt,
      status: 'scheduled',
      notes: interviewNotes || undefined,
    });
    notifyCandidateOfStatusChange(
      application.candidateId,
      'interview_scheduled',
      application.jobTitle
    );

    setSchedulingApplication(null);
    setInterviewDate('');
    setInterviewTime('');
    setInterviewNotes('');
    refreshEmployerData();
  };

  const handleMarkInterviewCompleted = (application: ApplicationItem) => {
    const candidate = getUserById(application.candidateId);
    if (!candidate) return;

    const updatedInterviews = (candidate.interviews ?? []).map((interview) =>
      interview.jobId === application.jobId && interview.status === 'scheduled'
        ? { ...interview, status: 'completed' as const }
        : interview
    );

    updateUserById(application.candidateId, { interviews: updatedInterviews });
    updateUserApplicationStatus(
      application.candidateId,
      application.applicationId,
      'interviewed'
    );
    notifyCandidateOfStatusChange(
      application.candidateId,
      'interviewed',
      application.jobTitle
    );
    refreshEmployerData();
  };

  const handleExtendOffer = (application: ApplicationItem) => {
    if (
      !window.confirm(
        `Extend a job offer to ${application.candidateName} for ${application.jobTitle}?`
      )
    ) {
      return;
    }

    extendOfferToCandidate({
      candidateId: application.candidateId,
      applicationId: application.applicationId,
      jobTitle: application.jobTitle,
    });
    refreshEmployerData();
  };

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filteredApplications =
    applicationFilter === 'all'
      ? allApplications
      : allApplications.filter((a) => a.status === applicationFilter);

  if (!user || !stats) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === 'applications' ? 'Applications' : activeTab === 'listings' ? 'My Listings' : 'Dashboard'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Welcome back, {user.firstName}</p>
          </div>
        
        </div>

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: 'blue' },
                { label: 'Active Jobs', value: stats.activeJobs, icon: TrendingUp, color: 'emerald' },
                { label: 'Total Applicants', value: stats.totalApplicants, icon: Users, color: 'violet' },
                { label: 'New This Week', value: stats.newApplicants, icon: UserCheck, color: 'amber' },
                { label: 'In Interview', value: stats.inPipeline, icon: CalendarClock, color: 'violet' },
                { label: 'Offers', value: stats.offers, icon: CheckCircle2, color: 'teal' },
                { label: 'Hired', value: stats.hired, icon: UserCheck, color: 'emerald' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-blue-50 text-blue-600">
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* RECENT APPLICANTS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Applicants</h2>
                  <button
                    onClick={() => navigate('/employer/dashboard?tab=applications')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </button>
                </div>
                {allApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No applicants yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allApplications.slice(0, 5).map((app) => (
                      <div key={app.applicationId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{app.candidateName}</p>
                          <p className="text-xs text-slate-500 truncate">{app.jobTitle}</p>
                        </div>
                        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}>
                          {APPLICATION_STATUS_LABELS[app.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MY COMPANY */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    My Company
                  </h2>
                  <button
                    onClick={() => { setIsEditingCompany(!isEditingCompany); setCompanyMessage(''); }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {isEditingCompany ? 'Cancel' : (company?.name ? 'Edit' : 'Add')}
                  </button>
                </div>

                {companyMessage && (
                  <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {companyMessage}
                  </div>
                )}

                {isEditingCompany ? (
                  <div className="space-y-3">
                    {[
                      { label: 'Company Name', field: 'name' as keyof Company, type: 'text' },
                      { label: 'Industry', field: 'industry' as keyof Company, type: 'text' },
                      { label: 'Location', field: 'location' as keyof Company, type: 'text' },
                      { label: 'Website', field: 'website' as keyof Company, type: 'text' },
                    ].map(({ label, field, type }) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                        <input
                          type={type}
                          value={(companyForm?.[field] as string) ?? ''}
                          onChange={(e) => handleCompanyFieldChange(field, e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Size</label>
                        <select
                          value={companyForm?.size ?? '1-10'}
                          onChange={(e) => handleCompanyFieldChange('size', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        >
                          {['1-10','11-50','51-200','201-500','501-1000','1000+'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Founded</label>
                        <input
                          type="number"
                          value={companyForm?.founded ?? new Date().getFullYear()}
                          onChange={(e) => handleCompanyFieldChange('founded', Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                      <textarea
                        value={companyForm?.description ?? ''}
                        onChange={(e) => handleCompanyFieldChange('description', e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      />
                    </div>
                    <button onClick={saveCompanyProfile} className="btn-primary w-full">
                      Save Company Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {company?.name ? (
                      <>
                        <p className="font-semibold text-slate-900 text-base">{company.name}</p>
                        <p className="text-slate-500">{company.industry}</p>
                        <p className="text-slate-500">{company.location}</p>
                        {company.website && <p className="text-slate-500">{company.website}</p>}
                        <div className="flex gap-4 pt-2 text-slate-500 text-xs">
                          <span>{company.size} employees</span>
                          <span>Founded {company.founded}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No company profile yet.</p>
                        <button
                          onClick={() => setIsEditingCompany(true)}
                          className="mt-3 text-sm text-blue-600 font-medium hover:underline"
                        >
                          Add company details
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: APPLICATIONS ── */}
        {activeTab === 'applications' && (
          <div className="space-y-5">

            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
              {APPLICATION_FILTERS.map((filter) => {
                const count = filter === 'all'
                  ? allApplications.length
                  : allApplications.filter((a) => a.status === filter).length;
                return (
                  <button
                    key={filter}
                    onClick={() => setApplicationFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      applicationFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {filter === 'all' ? 'All' : APPLICATION_STATUS_LABELS[filter]}
                    <span className={`ml-1.5 text-xs ${applicationFilter === filter ? 'opacity-70' : 'text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Applications list */}
            {filteredApplications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-700">No applications found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {applicationFilter === 'all' ? 'No one has applied to your jobs yet.' : `No ${applicationFilter} applications.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <div key={app.applicationId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

                    {/* Main row */}
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-700">
                            {app.candidateName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{app.candidateName}</p>
                            <CopyEmailButton email={app.candidateEmail} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                            {app.jobTitle}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${APPLICATION_STATUS_COLORS[app.status]}`}>
                            {APPLICATION_STATUS_LABELS[app.status]}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setViewingProfile(app)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View candidate profile
                        </button>
                        {app.coverLetter && (
                          <button
                            type="button"
                            onClick={() => setExpandedApplication(
                              expandedApplication === app.applicationId ? null : app.applicationId
                            )}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {expandedApplication === app.applicationId ? 'Hide cover letter ↑' : 'View cover letter ↓'}
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      {!['hired', 'rejected', 'declined', 'offer'].includes(app.status) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {app.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(app, 'reviewing')}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Start Reviewing
                            </button>
                          )}
                          {(app.status === 'pending' || app.status === 'reviewing') && (
                            <button
                              type="button"
                              onClick={() => setSchedulingApplication(
                                schedulingApplication?.applicationId === app.applicationId ? null : app
                              )}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              Schedule Interview
                            </button>
                          )}
                          {app.status === 'interview_scheduled' && (
                            <button
                              type="button"
                              onClick={() => handleMarkInterviewCompleted(app)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark Interview Completed
                            </button>
                          )}
                          {app.status === 'interviewed' && (
                            <button
                              type="button"
                              onClick={() => handleExtendOffer(app)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Extend Offer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(app, 'rejected')}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}

                      {app.status === 'offer' && (
                        <p className="mt-3 text-xs text-teal-700 font-medium">
                          Offer extended — waiting for the candidate to accept or decline.
                        </p>
                      )}

                      {app.status === 'hired' && (
                        <p className="mt-3 text-xs text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Hired — job listing has been closed and other applicants were notified.
                        </p>
                      )}

                      {app.status === 'declined' && (
                        <p className="mt-3 text-xs text-slate-600 font-medium">
                          The candidate declined the offer for this role.
                        </p>
                      )}
                    </div>

                    {/* Cover letter expanded */}
                    {expandedApplication === app.applicationId && app.coverLetter && (
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cover Letter</p>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{app.coverLetter}</p>
                      </div>
                    )}

                    {/* Interview scheduling form */}
                    {schedulingApplication?.applicationId === app.applicationId && (
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4 bg-slate-50">
                        <p className="text-sm font-semibold text-slate-700 mb-3">Schedule Interview</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Date</label>
                            <input
                              type="date"
                              value={interviewDate}
                              onChange={(e) => setInterviewDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Time</label>
                            <input
                              type="time"
                              value={interviewTime}
                              onChange={(e) => setInterviewTime(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs text-slate-600 mb-1">Notes for candidate (optional)</label>
                          <textarea
                            value={interviewNotes}
                            onChange={(e) => setInterviewNotes(e.target.value)}
                            rows={2}
                            placeholder="e.g. Please bring your portfolio. Interview will be via Zoom."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleScheduleInterview(app)}
                            disabled={!interviewDate || !interviewTime}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Send Interview Invite
                          </button>
                          <button
                            onClick={() => { setSchedulingApplication(null); setInterviewDate(''); setInterviewTime(''); setInterviewNotes(''); }}
                            className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: MY LISTINGS ── */}
        {activeTab === 'listings' && (
          <div className="space-y-5">

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{jobs.length}</span> job{jobs.length !== 1 ? 's' : ''} posted
              </p>
              
            </div>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-700">No jobs posted yet</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Post your first job to start receiving applications.</p>
                <button onClick={() => navigate('/employer/post-job')} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Post a Job
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const jobApps = allApplications.filter((a) => a.jobId === job.id);
                  const pendingJobApps = jobApps.filter((a) => a.status === 'pending').length;
                  return (
                    <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{job.title}</h3>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              job.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {job.status}
                            </span>
                            {pendingJobApps > 0 && (
                              <span className="rounded-full bg-red-50 text-red-700 px-2.5 py-0.5 text-xs font-medium">
                                {pendingJobApps} new
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                            <span>{job.location}</span>
                            <span className="capitalize">{job.type}</span>
                            {job.remote && <span className="text-blue-600 font-medium">Remote</span>}
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {job.views ?? 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {jobApps.length} applicant{jobApps.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            View
                          </Link>
                          {jobApps.length > 0 && (
                            <button
                              onClick={() => navigate('/employer/dashboard?tab=applications')}
                              className="rounded-xl bg-blue-50 text-blue-700 px-3 py-2 text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                              See applicants
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this job posting? This cannot be undone.')) {
                                deleteJob(job.id);
                                refreshEmployerData();
                              }
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 mt-3 line-clamp-2">{job.description}</p>

                      <p className="text-xs text-slate-400 mt-3">
                        Posted {new Date(job.postedAt).toLocaleDateString()} · Expires {new Date(job.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            {(() => {
              const liveCandidate = getUserById(viewingProfile.candidateId);
              const snapshot = viewingProfile.profileSnapshot;
              const profile = {
                firstName: snapshot?.firstName ?? liveCandidate?.firstName ?? viewingProfile.candidateName.split(' ')[0],
                lastName: snapshot?.lastName ?? liveCandidate?.lastName ?? viewingProfile.candidateName.split(' ').slice(1).join(' '),
                email: snapshot?.email ?? viewingProfile.candidateEmail,
                headline: snapshot?.headline ?? liveCandidate?.headline,
                location: snapshot?.location ?? liveCandidate?.location,
                phone: snapshot?.phone ?? liveCandidate?.phone,
                bio: snapshot?.bio ?? liveCandidate?.bio,
                skills: (snapshot?.skills?.length ? snapshot.skills : null) ?? liveCandidate?.skills ?? [],
                experience: (snapshot?.experience?.length ? snapshot.experience : null) ?? liveCandidate?.experience ?? [],
                education: (snapshot?.education?.length ? snapshot.education : null) ?? liveCandidate?.education ?? [],
                languages: (snapshot?.languages?.length ? snapshot.languages : null) ?? liveCandidate?.languages ?? [],
                certifications: (snapshot?.certifications?.length ? snapshot.certifications : null) ?? liveCandidate?.certifications ?? [],
                links: snapshot?.links ?? liveCandidate?.links ?? {},
              };

              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {profile.firstName} {profile.lastName}
                      </h2>
                      <p className="text-sm text-slate-500">{profile.email}</p>
                      {profile.headline && (
                        <p className="text-sm text-slate-600 mt-2">{profile.headline}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingProfile(null)}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
                    {profile.location && <p><span className="font-medium text-slate-900">Location:</span> {profile.location}</p>}
                    {profile.phone && <p><span className="font-medium text-slate-900">Phone:</span> {profile.phone}</p>}
                  </div>

                  {profile.bio && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">About</h3>
                      <p className="text-sm text-slate-600 whitespace-pre-line">{profile.bio}</p>
                    </div>
                  )}

                  {profile.skills.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill: any) => {
                          const name = typeof skill === 'string' ? skill : skill.name;
                          const level = typeof skill === 'string' ? null : skill.level;
                          return (
                            <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                              {name}
                              {level && <span className="opacity-60 text-[0.6rem] uppercase">{level}</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {profile.experience.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Experience</h3>
                      <div className="space-y-3">
                        {profile.experience.map((item) => (
                          <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="text-sm text-slate-500">{item.company}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {item.startDate} - {item.current ? 'Present' : item.endDate}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.education.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Education</h3>
                      <div className="space-y-3">
                        {profile.education.map((item) => (
                          <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                            <p className="font-medium text-slate-900">{item.institution}</p>
                            <p className="text-sm text-slate-500">{item.degree} in {item.field}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingProfile.coverLetter && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Cover Letter</h3>
                      <p className="text-sm text-slate-600 whitespace-pre-line">{viewingProfile.coverLetter}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}