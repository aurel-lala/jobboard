import type { JobApplication } from '@/types';

export const APPLICATION_STATUS_LABELS: Record<JobApplication['status'], string> = {
  pending: 'Applied',
  reviewing: 'Under Review',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interview Completed',
  offer: 'Offer Extended',
  hired: 'Hired',
  rejected: 'Not Selected',
  declined: 'Offer Declined',
};

export const APPLICATION_STATUS_COLORS: Record<JobApplication['status'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  reviewing: 'bg-blue-50 text-blue-700',
  interview_scheduled: 'bg-violet-50 text-violet-700',
  interviewed: 'bg-indigo-50 text-indigo-700',
  offer: 'bg-teal-50 text-teal-700',
  hired: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  declined: 'bg-slate-100 text-slate-600',
};

export const CANDIDATE_STATUS_PIPELINE: JobApplication['status'][] = [
  'pending',
  'reviewing',
  'interview_scheduled',
  'interviewed',
  'offer',
  'hired',
];

export const TERMINAL_APPLICATION_STATUSES: JobApplication['status'][] = [
  'hired',
  'rejected',
  'declined',
];

export function normalizeApplicationStatus(status: string): JobApplication['status'] {
  if (status === 'shortlisted') return 'interview_scheduled';
  return status as JobApplication['status'];
}

export function isTerminalApplicationStatus(status: JobApplication['status']): boolean {
  return TERMINAL_APPLICATION_STATUSES.includes(status);
}

export function getStatusNotificationMessage(
  status: JobApplication['status'],
  jobTitle: string
): string {
  switch (status) {
    case 'reviewing':
      return `Your application for ${jobTitle} is now under review.`;
    case 'interview_scheduled':
      return `An interview has been scheduled for ${jobTitle}. Check your dashboard for details.`;
    case 'interviewed':
      return `Your interview for ${jobTitle} has been marked as completed. The employer will follow up soon.`;
    case 'offer':
      return `You received a job offer for ${jobTitle}. Review and respond from your dashboard.`;
    case 'rejected':
      return `Thank you for your interest in ${jobTitle}. The employer has decided to move forward with other candidates.`;
    case 'hired':
      return `Congratulations! You have been hired for ${jobTitle}.`;
    case 'declined':
      return `You declined the offer for ${jobTitle}.`;
    default:
      return `Your application for ${jobTitle} was updated.`;
  }
}
