import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Job } from '@/types';
import { getUserById, addNotificationToUser } from '@/services/auth';
import { getJobById, incrementJobApplicants, incrementJobViewsOnce, getJobs } from '@/services/jobs';
import { useAuth } from '@/contexts/AuthContext';
import { isJobPubliclyVisible } from '@/lib/jobFilters';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, normalizeApplicationStatus } from '@/lib/applicationStatus';

function getRelatedJobs(job: Job): Job[] {
  return getJobs()
    .filter((j) =>
      j.id !== job.id &&
      isJobPubliclyVisible(j) &&
      (j.company.id === job.company.id ||
        j.skills.some((s) => job.skills.includes(s)))
    )
    .slice(0, 3);
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [applied, setApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (!id) return;
    const found = getJobById(id);
    setJob(found);
    if (found) {
      setRelatedJobs(getRelatedJobs(found));
      setApplied(user?.appliedJobs.includes(id) ?? false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    const updated = incrementJobViewsOnce(id);
    if (updated) {
      setJob(updated);
    }
  }, [id]);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-7xl font-black text-slate-100 mb-2">404</p>
          <h2 className="text-xl font-semibold text-slate-900">Job not found</h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">This listing may have been removed or the link is invalid.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
            <Link to="/" className="btn-secondary">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const formatSalary = () => {
    const { min, max, currency, period } = job.salary;
    if (min === 0 && max === 0) {
      return 'Salary not disclosed';
    }
    const symbol = currency === 'USD' ? '$' : currency;
    const suffix =
      period === 'year' ? '/year' : period === 'month' ? '/month' : '/hour';
    return `${symbol}${min} - ${symbol}${max} ${suffix}`;
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const saved = user ? user.savedJobs.includes(job?.id ?? '') : false;
  const existingApplication = user?.applications?.find((a) => a.jobId === job.id);
  const applicationStatus = existingApplication
    ? normalizeApplicationStatus(existingApplication.status)
    : null;
  const isOpen = isJobPubliclyVisible(job);
  const canApply = user?.role === 'candidate' && isOpen;

  const handleToggleSave = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const newSaved = !saved;
    const updatedSavedJobs = newSaved
      ? [...user.savedJobs, job.id]
      : user.savedJobs.filter((jid) => jid !== job.id);

    updateUser({ savedJobs: updatedSavedJobs });
  };

  const handleOpenApplyModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setCoverLetter('');
    setShowApplyModal(true);
  };

  const handleApplySubmit = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'candidate' || !isOpen) {
      return;
    }

    if (user.appliedJobs.includes(job.id)) {
      navigate('/candidate/dashboard');
      return;
    }

    const newApplication = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      candidateId: user.id,
      status: 'pending' as const,
      appliedAt: new Date().toISOString(),
      coverLetter: coverLetter.trim() || undefined,
      profileSnapshot: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        headline: user.headline,
        location: user.location,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills ?? [],
        experience: user.experience ?? [],
        education: user.education ?? [],
        languages: user.languages ?? [],
        certifications: user.certifications ?? [],
        links: user.links ?? {},
      },
    };

    updateUser({
      appliedJobs: [...user.appliedJobs, job.id],
      applications: [...(user.applications ?? []), newApplication],
      notifications: [
        ...(user.notifications ?? []),
        {
          id: `notif-${Date.now()}`,
          title: 'Application submitted',
          message: `Your application for ${job.title} has been sent to the employer.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const updatedJob = incrementJobApplicants(job.id);
    if (updatedJob) {
      setJob(updatedJob);
    }

    const employer = job.postedById ? getUserById(job.postedById) : null;
    if (employer) {
      addNotificationToUser(employer.id, {
        id: `notif-${Date.now() + 1}`,
        title: 'New job application',
          message: `${user.firstName} ${user.lastName} applied for ${job.title}. Review their profile and application.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    setApplied(true);
    setShowApplyModal(false);
    setCoverLetter('');
    navigate('/candidate/dashboard');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)] pb-10">

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <img
                  src={job.company.logo}
                  alt={`${job.company.name} logo`}
                  className="h-16 w-16 rounded-3xl object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Job detail</p>
                  <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 truncate">{job.title}</h1>
                  <p className="mt-2 text-sm text-slate-500">{job.company.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {job.type}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {job.experienceLevel}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {job.location}
                </span>
                {job.remote && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Remote
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-500">
                <p>{formatSalary()}</p>
                <p>{job.applicants} applicant{job.applicants === 1 ? '' : 's'}</p>
                <p>Posted: {formatDate(job.postedAt)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              {applied && applicationStatus ? (
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${APPLICATION_STATUS_COLORS[applicationStatus]}`}>
                    {APPLICATION_STATUS_LABELS[applicationStatus]}
                  </span>
                  <span className="text-xs text-slate-400">Application submitted</span>
                </div>
              ) : (
                <button
                  onClick={handleOpenApplyModal}
                  className="btn-primary w-full sm:w-auto"
                  disabled={!canApply}
                >
                  Apply Now
                </button>
              )}
              <button
                onClick={handleToggleSave}
                className="btn-secondary w-full sm:w-auto"
              >
                {saved ? 'Saved' : 'Save Job'}
              </button>
              {!isOpen && (
                <p className="mt-2 text-sm text-slate-500">This position is no longer accepting applications.</p>
              )}
              {isOpen && user && user.role !== 'candidate' && (
                <p className="mt-2 text-sm text-amber-600">Only candidates may apply to this job.</p>
              )}
            </div>
          </div>
        </div>

        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Submit your application</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Add a short cover letter so the employer sees why you're the right fit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="text-slate-500 hover:text-slate-900"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Cover Letter</label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={8}
                    className="mt-2 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Write a brief note to the employer about your experience and why you're interested in this role."
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySubmit}
                    className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Submit application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
              <p className="text-sm leading-7 text-slate-600 whitespace-pre-line">{job.description}</p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Skills</h2>
              {job.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(s => (
                    <span
                      key={s}
                      className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No skills specified for this role.</p>
              )}
            </div>

            {relatedJobs.length > 0 && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Similar Jobs</h2>
                  <span className="text-sm text-slate-500">{relatedJobs.length} found</span>
                </div>
                <div className="space-y-3">
                  {relatedJobs.map(j => (
                    <Link
                      key={j.id}
                      to={`/jobs/${j.id}`}
                      className="block rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-white"
                    >
                      <p className="font-medium text-slate-900">{j.title}</p>
                      <p className="text-sm text-slate-500">{j.company.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Company</h3>
              <div className="flex items-center gap-4">
                <img
                  src={job.company.logo}
                  alt={`${job.company.name} logo`}
                  className="h-14 w-14 rounded-3xl object-cover border border-slate-200"
                />
                <div>
                  <p className="font-semibold text-slate-900">{job.company.name}</p>
                  <p className="text-sm text-slate-500">{job.company.industry}</p>
                </div>
              </div>
              <div className="mt-6 text-sm leading-6 text-slate-600">
                <p>{job.company.description}</p>
              </div>
            </div>

          
          </aside>
        </div>
      </div>
    </div>
  );
}