import type { Job } from '@/types';

export interface JobListFilters {
  query?: string;
  location?: string;
  types?: string[];
  experience?: string[];
  salary?: { min: number; max: number } | null;
  remote?: boolean;
  savedJobIds?: string[];
  savedOnly?: boolean;
}

export function isJobPubliclyVisible(job: Job): boolean {
  if (job.status !== 'active') return false;
  return new Date(job.expiresAt) >= new Date();
}

export function matchesSalaryRange(
  job: Job,
  range: { min: number; max: number }
): boolean {
  if (job.salary.min === 0 && job.salary.max === 0) return true;
  return job.salary.max >= range.min && job.salary.min <= range.max;
}

export function filterJobs(jobs: Job[], filters: JobListFilters): Job[] {
  return jobs.filter((job) => {
    if (!isJobPubliclyVisible(job)) return false;

    if (filters.savedOnly && !(filters.savedJobIds ?? []).includes(job.id)) {
      return false;
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matches =
        job.title.toLowerCase().includes(q) ||
        job.company.name.toLowerCase().includes(q) ||
        job.skills.some((skill) => skill.toLowerCase().includes(q));

      if (!matches) return false;
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      if (!job.location.toLowerCase().includes(loc)) return false;
    }

    if (filters.types && filters.types.length > 0 && !filters.types.includes(job.type)) {
      return false;
    }

    if (
      filters.experience &&
      filters.experience.length > 0 &&
      !filters.experience.includes(job.experienceLevel)
    ) {
      return false;
    }

    if (filters.salary && !matchesSalaryRange(job, filters.salary)) {
      return false;
    }

    if (filters.remote && !job.remote) {
      return false;
    }

    return true;
  });
}
