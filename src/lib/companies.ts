import { isJobPubliclyVisible } from '@/lib/jobFilters';
import type { Company, Job } from '@/types';

export function buildCompaniesFromJobs(jobs: Job[]): Company[] {
  const companiesById = jobs.reduce<Record<string, Company>>((acc, job) => {
    if (!job.company?.id || acc[job.company.id]) {
      return acc;
    }

    acc[job.company.id] = { ...job.company };
    return acc;
  }, {});

  return Object.values(companiesById).map((company) => ({
    ...company,
    openPositions: jobs.filter(
      (job) => job.company.id === company.id && isJobPubliclyVisible(job)
    ).length,
  }));
}
