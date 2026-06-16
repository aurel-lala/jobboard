import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Briefcase,
  Bookmark,
  CalendarDays,
  ChevronRight,
  FileText,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  MapPin,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { getCurrentUser, updateUser } from '@/services/auth';
import { respondToOffer, notifyEmployerOfWithdrawal } from '@/services/applications';
import { decrementJobApplicants, getJobById, getJobs } from '@/services/jobs';
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  CANDIDATE_STATUS_PIPELINE,
  normalizeApplicationStatus,
} from '@/lib/applicationStatus';
import type { User } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function interviewCountdown(dateStr: string): { label: string; isPast: boolean } {
  const diff = new Date(dateStr).getTime() - Date.now();
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (isPast) {
    if (hours < 24) return { label: `${hours}h ago`, isPast: true };
    return { label: `${days}d ago`, isPast: true };
  }
  if (hours < 1) return { label: 'Starting soon', isPast: false };
  if (hours < 24) return { label: `In ${hours}h`, isPast: false };
  if (days === 1) return { label: 'Tomorrow', isPast: false };
  return { label: `In ${days} days`, isPast: false };
}

/* ─── component ───────────────────────────────────────────────────────────── */

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  // Refresh user on every navigation so status changes from employers show up
  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      navigate('/login');
      return;
    }
    setUser(current);
  }, [navigate, location.key, location.search]);

  const handleWithdraw = (applicationId: string, jobId: string) => {
    if (!user) return;
    if (!window.confirm('Withdraw this application? This cannot be undone.')) return;

    const job = getJobById(jobId);
    const updatedApplications = (user.applications ?? []).filter(
      (a) => a.id !== applicationId
    );
    const updatedAppliedJobs = user.appliedJobs.filter((id) => id !== jobId);

    const updated = updateUser({
      applications: updatedApplications,
      appliedJobs: updatedAppliedJobs,
    });
    if (updated) {
      decrementJobApplicants(jobId);
      if (job?.postedById) {
        notifyEmployerOfWithdrawal(
          job.postedById,
          `${user.firstName} ${user.lastName}`,
          job.title
        );
      }
      setUser(updated);
    }
  };

  const handleOfferResponse = (applicationId: string, jobId: string, jobTitle: string, accept: boolean) => {
    if (!user) return;

    const confirmMessage = accept
      ? 'Accept this job offer? This will confirm your hire for this role.'
      : 'Decline this job offer? The employer will be notified.';

    if (!window.confirm(confirmMessage)) return;

    const result = respondToOffer({
      candidateId: user.id,
      applicationId,
      jobId,
      jobTitle,
      accept,
    });

    if (result) {
      setUser(getCurrentUser());
    }
  };

  const handleMarkNotificationsRead = () => {
    if (!user) return;
    const updated = updateUser({
      notifications: (user.notifications ?? []).map((n) => ({ ...n, read: true })),
    });
    if (updated) setUser(updated);
  };

  const handleMarkOneRead = (id: string) => {
    if (!user) return;
    const updated = updateUser({
      notifications: (user.notifications ?? []).map((n) => n.id === id ? { ...n, read: true } : n),
    });
    if (updated) setUser(updated);
  };

  const [showAllNotifications, setShowAllNotifications] = useState(false);

  if (!user) return null;

  const allJobs = getJobs();
  const allNotifications = [...(user.notifications ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const notifications = showAllNotifications ? allNotifications : allNotifications.slice(0, 5);
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const applicationItems = (user.applications ?? [])
    .map((application) => ({
      application: {
        ...application,
        status: normalizeApplicationStatus(application.status),
      },
      job: allJobs.find((j) => j.id === application.jobId) ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(b.application.appliedAt).getTime() -
        new Date(a.application.appliedAt).getTime()
    );

  const savedJobItems = (user.savedJobs ?? [])
    .map((id) => allJobs.find((j) => j.id === id))
    .filter(Boolean);

  const upcomingInterviews = (user.interviews ?? [])
    .map((interview) => ({
      interview,
      job: allJobs.find((j) => j.id === interview.jobId) ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(a.interview.scheduledAt).getTime() -
        new Date(b.interview.scheduledAt).getTime()
    );

  const activeApplications = applicationItems.filter(
    (i) =>
      i.application.status !== 'rejected' &&
      i.application.status !== 'hired' &&
      i.application.status !== 'declined'
  ).length;

  const tab = new URLSearchParams(location.search).get('tab');
  const activeTab =
    tab === 'applications' ? 'applications'
    : tab === 'saved' ? 'saved'
    : tab === 'interviews' ? 'interviews'
    : 'dashboard';

  const pageTitle =
    activeTab === 'applications' ? 'My Applications'
    : activeTab === 'saved' ? 'Saved Jobs'
    : activeTab === 'interviews' ? 'Interviews'
    : 'My Dashboard';

  const pageSubtitle =
    activeTab === 'applications' ? 'Track status and manage your job applications.'
    : activeTab === 'saved' ? 'Jobs you bookmarked while browsing.'
    : activeTab === 'interviews' ? 'Upcoming and past interview invitations.'
    : `Welcome back, ${user.firstName}! Track your job search progress.`;

  const stats = [
    {
      label: 'Applications',
      value: applicationItems.length,
      icon: Briefcase,
      color: 'blue',
      to: '/candidate/dashboard?tab=applications',
    },
    {
      label: 'Saved Jobs',
      value: savedJobItems.length,
      icon: Bookmark,
      color: 'amber',
      to: '/candidate/dashboard?tab=saved',
    },
    {
      label: 'Interviews',
      value: upcomingInterviews.length,
      icon: CalendarDays,
      color: 'emerald',
      to: '/candidate/dashboard?tab=interviews',
    },
    {
      label: 'Active',
      value: activeApplications,
      icon: Clock,
      color: 'violet',
      to: '/candidate/dashboard?tab=applications',
    },
  ];

  const showApplications = activeTab === 'dashboard' || activeTab === 'applications';
  const showInterviews = activeTab === 'dashboard' || activeTab === 'interviews';
  const showSaved = activeTab === 'dashboard' || activeTab === 'saved';
  const applicationsToShow =
    activeTab === 'dashboard' ? applicationItems.slice(0, 3) : applicationItems;
  const interviewsToShow =
    activeTab === 'dashboard' ? upcomingInterviews.slice(0, 2) : upcomingInterviews;
  const savedToShow =
    activeTab === 'dashboard' ? savedJobItems.slice(0, 3) : savedJobItems;

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{pageSubtitle}</p>
        </div>

        {/* Stats */}
        {activeTab === 'dashboard' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Link
              key={stat.label}
              to={stat.to}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all group"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600'
                : stat.color === 'amber' ? 'bg-amber-50 text-amber-600'
                : stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600'
                : 'bg-violet-50 text-violet-600'
              }`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Main Column ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Applications */}
            {showApplications && (
            <div id="applications" className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  My Applications
                </h2>
                {activeTab === 'dashboard' && applicationItems.length > 3 ? (
                  <Link
                    to="/candidate/dashboard?tab=applications"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </Link>
                ) : (
                  <Link to="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Browse more jobs
                  </Link>
                )}
              </div>

              {applicationsToShow.length === 0 ? (
                <div className="text-center py-10">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No applications yet</p>
                  <p className="text-sm text-slate-500 mt-1 mb-4">
                    Start applying to jobs to track your progress here.
                  </p>
                  <Link to="/jobs" className="btn-primary inline-flex">
                    <Search className="w-4 h-4" />
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicationsToShow.map(({ application, job }) => {
                    const isRejected = application.status === 'rejected';
                    const isHired = application.status === 'hired';
                    const isDeclined = application.status === 'declined';
                    const isOffer = application.status === 'offer';
                    const pipelineIndex = CANDIDATE_STATUS_PIPELINE.indexOf(application.status);

                    return (
                      <div
                        key={application.id}
                        className={`rounded-xl border p-4 transition-colors ${
                          isRejected ? 'border-rose-100 bg-rose-50/30'
                          : isHired ? 'border-emerald-100 bg-emerald-50/30'
                          : 'border-slate-200'
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            {job ? (
                              <Link
                                to={`/jobs/${job.id}`}
                                className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                              >
                                {job.title}
                              </Link>
                            ) : (
                              <p className="font-semibold text-slate-500 italic">Job no longer available</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              {job?.company && (
                                <span className="text-sm text-slate-500 flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5" />
                                  {job.company.name}
                                </span>
                              )}
                              {job?.location && (
                                <span className="text-sm text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {job.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${APPLICATION_STATUS_COLORS[application.status]}`}>
                              {APPLICATION_STATUS_LABELS[application.status]}
                            </span>
                          </div>
                        </div>

                        {/* Status pipeline (not shown for rejected/hired) */}
                        {!isRejected && !isHired && !isDeclined && (
                          <div className="mt-4 flex items-center gap-1">
                            {CANDIDATE_STATUS_PIPELINE.map((step, i) => {
                              const isComplete = i < pipelineIndex;
                              const isCurrent = i === pipelineIndex;
                              return (
                                <div key={step} className="flex items-center flex-1 min-w-0">
                                  <div className="flex flex-col items-center flex-1 min-w-0">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                      isCurrent ? 'bg-blue-600 ring-4 ring-blue-100'
                                      : isComplete ? 'bg-blue-600'
                                      : 'bg-slate-200'
                                    }`} />
                                    <span className={`text-[0.6rem] mt-1 truncate w-full text-center ${
                                      isCurrent ? 'text-blue-600 font-semibold'
                                      : isComplete ? 'text-slate-600'
                                      : 'text-slate-400'
                                    }`}>
                                      {APPLICATION_STATUS_LABELS[step]}
                                    </span>
                                  </div>
                                  {i < CANDIDATE_STATUS_PIPELINE.length - 1 && (
                                    <div className={`h-px flex-1 mx-1 mb-3 ${
                                      i < pipelineIndex ? 'bg-blue-600' : 'bg-slate-200'
                                    }`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Hired banner */}
                        {isHired && (
                          <div className="mt-3 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Congratulations — you were hired for this role!
                          </div>
                        )}

                        {isOffer && job && (
                          <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4">
                            <p className="text-sm font-semibold text-teal-900">
                              You have a job offer for this role
                            </p>
                            <p className="text-xs text-teal-700 mt-1">
                              Review the offer and let the employer know your decision.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleOfferResponse(application.id, job.id, job.title, true)}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Accept Offer
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOfferResponse(application.id, job.id, job.title, false)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Decline Offer
                              </button>
                            </div>
                          </div>
                        )}

                        {isDeclined && (
                          <div className="mt-3 flex items-center gap-2 text-slate-600 text-sm">
                            <XCircle className="w-4 h-4" />
                            You declined the offer for this role.
                          </div>
                        )}

                        {/* Rejected banner */}
                        {isRejected && (
                          <div className="mt-3 flex items-center gap-2 text-rose-600 text-sm">
                            <XCircle className="w-4 h-4" />
                            Application was not selected
                          </div>
                        )}

                        {/* Cover letter snippet */}
                        {application.coverLetter && (
                          <p className="mt-3 text-xs text-slate-500 line-clamp-2 bg-slate-50 rounded-lg px-3 py-2">
                            "{application.coverLetter}"
                          </p>
                        )}

                        {/* Bottom row */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Applied {timeAgo(application.appliedAt)}
                          </span>
                          {application.status === 'pending' && (
                            <button
                              onClick={() => handleWithdraw(application.id, application.jobId)}
                              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* Interviews */}
            {showInterviews && (
            <div id="interviews" className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                  Interviews
                </h2>
                {activeTab === 'dashboard' && upcomingInterviews.length > 2 && (
                  <Link
                    to="/candidate/dashboard?tab=interviews"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </Link>
                )}
              </div>

              {interviewsToShow.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No interviews scheduled</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Interviews scheduled by employers will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interviewsToShow.map(({ interview, job }) => {
                    const { label: countdown, isPast } = interviewCountdown(interview.scheduledAt);
                    return (
                      <div
                        key={interview.id}
                        className={`rounded-xl border p-4 ${
                          isPast ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-emerald-100 bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{interview.companyName}</p>
                            {job && (
                              <Link
                                to={`/jobs/${job.id}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {job.title}
                              </Link>
                            )}
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(interview.scheduledAt).toLocaleString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isPast ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {countdown}
                            </span>
                            <span className="text-xs text-slate-400 capitalize">{interview.status}</span>
                          </div>
                        </div>
                        {interview.notes && (
                          <div className="mt-3 rounded-lg bg-white border border-slate-200 px-3 py-2.5">
                            <p className="text-xs font-semibold text-slate-600 mb-1">Notes from employer</p>
                            <p className="text-sm text-slate-600">{interview.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* Saved Jobs */}
            {showSaved && (
            <div id="saved" className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-500" />
                  Saved Jobs
                </h2>
                {activeTab === 'dashboard' && savedJobItems.length > 3 ? (
                  <Link
                    to="/candidate/dashboard?tab=saved"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </Link>
                ) : (
                  <Link to="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Browse more
                  </Link>
                )}
              </div>

              {savedToShow.length === 0 ? (
                <div className="text-center py-8">
                  <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No saved jobs yet</p>
                  <p className="text-sm text-slate-500 mt-1 mb-4">
                    Bookmark jobs while browsing to save them here.
                  </p>
                  <Link to="/jobs" className="btn-primary inline-flex">
                    <Search className="w-4 h-4" />
                    Browse Jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedToShow.map((job) => {
                    if (!job) return null;
                    const alreadyApplied = user.appliedJobs.includes(job.id);
                    return (
                      <div key={job.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {job.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {job.company.name}
                            </span>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {job.location}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {alreadyApplied ? (
                            <span className="text-xs text-slate-400 font-medium">Applied</span>
                          ) : (
                            <Link
                              to={`/jobs/${job.id}`}
                              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                            >
                              Apply
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">

            {/* Quick profile card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;
                  }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-slate-500 truncate">{user.email}</p>
                  {user.headline && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{user.headline}</p>
                  )}
                </div>
              </div>

              {/* Profile completeness */}
              {(() => {
                const fields = [user.headline, user.bio, user.location, user.phone,
                  user.skills?.length, user.experience?.length, user.education?.length];
                const filled = fields.filter(Boolean).length;
                const pct = Math.round((filled / fields.length) * 100);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500">Profile completeness</span>
                      <span className="text-xs font-semibold text-slate-700">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {pct < 100 && (
                      <Link
                        to="/profile"
                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium block"
                      >
                        Complete your profile →
                      </Link>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </h2>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && handleMarkOneRead(n.id)}
                      className={`rounded-xl border p-3 transition-colors ${
                        !n.read
                          ? 'border-blue-100 bg-blue-50 cursor-pointer hover:bg-blue-100'
                          : 'border-slate-100 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {!n.read && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      </div>
                      {n.createdAt && (
                        <p className="text-[0.65rem] text-slate-400 mt-1.5 ml-4">
                          {timeAgo(n.createdAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {allNotifications.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllNotifications((v) => !v)}
                  className="mt-3 w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {showAllNotifications
                    ? 'Show less'
                    : `See all ${allNotifications.length} notifications`}
                </button>
              )}
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 opacity-80" />
                <p className="font-semibold">Job Search Tips</p>
              </div>
              <ul className="space-y-2 text-sm opacity-90">
                <li>• Tailor your cover letter for each role</li>
                <li>• Keep your profile 100% complete</li>
                <li>• Follow up after interviews</li>
                <li>• Apply to roles within 24h of posting</li>
              </ul>
              <Link
                to="/profile"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 transition-colors"
              >
                Update Profile
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}