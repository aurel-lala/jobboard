import type { Job } from '@/types';
import { isJobPubliclyVisible } from '@/lib/jobFilters';

export const JOBS_STORAGE_KEY = 'jobconnect_jobs';

function safeReadJobs(): Job[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(JOBS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    localStorage.removeItem(JOBS_STORAGE_KEY);
    return [];
  }
}

function persistJobs(jobs: Job[]): void {
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
}

export function getJobs(): Job[] {
  return safeReadJobs();
}

export function getActiveJobs(): Job[] {
  return safeReadJobs().filter(isJobPubliclyVisible);
}

export function getJobById(id: string): Job | null {
  return safeReadJobs().find((job) => job.id === id) ?? null;
}

export function saveJob(job: Job): Job {
  const jobs = safeReadJobs();
  persistJobs([...jobs, job]);
  return job;
}

export function updateJob(id: string, updates: Partial<Job>): Job | null {
  const jobs = safeReadJobs();
  const updatedJobs = jobs.map((job) => (job.id === id ? { ...job, ...updates } : job));
  const updatedJob = updatedJobs.find((job) => job.id === id) ?? null;
  if (updatedJob) {
    persistJobs(updatedJobs);
  }
  return updatedJob;
}

export function deleteJob(id: string): boolean {
  const jobs = safeReadJobs();
  const updatedJobs = jobs.filter((job) => job.id !== id);
  if (updatedJobs.length === jobs.length) return false;
  persistJobs(updatedJobs);
  return true;
}

export function incrementJobApplicants(id: string): Job | null {
  const job = getJobById(id);
  if (!job) return null;
  return updateJob(id, { applicants: job.applicants + 1 });
}

export function decrementJobApplicants(id: string): Job | null {
  const job = getJobById(id);
  if (!job || job.applicants <= 0) return job;
  return updateJob(id, { applicants: job.applicants - 1 });
}

export function incrementJobViews(id: string): Job | null {
  const job = getJobById(id);
  if (!job) return null;
  return updateJob(id, { views: (job.views ?? 0) + 1 });
}

export function incrementJobViewsOnce(id: string): Job | null {
  if (typeof window === 'undefined') return null;
  const viewedKey = `jobconnect_viewed_${id}`;
  if (sessionStorage.getItem(viewedKey)) {
    return getJobById(id);
  }
  const updated = incrementJobViews(id);
  sessionStorage.setItem(viewedKey, '1');
  return updated;
}

export function clearJobs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(JOBS_STORAGE_KEY);
}
