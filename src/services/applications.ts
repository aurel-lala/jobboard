import { getStatusNotificationMessage } from '@/lib/applicationStatus';
import {
  getUserById,
  getUsers,
  addNotificationToUser,
  updateUserApplicationStatus,
} from '@/services/auth';
import { getJobById, updateJob } from '@/services/jobs';
import type { JobApplication, Notification, User } from '@/types';

const ACTIVE_COMPETING_STATUSES: JobApplication['status'][] = [
  'pending',
  'reviewing',
  'interview_scheduled',
  'interviewed',
  'offer',
];

function createNotification(
  title: string,
  message: string,
  type: Notification['type'] = 'info'
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export function rejectOtherApplicantsForJob(
  jobId: string,
  jobTitle: string,
  exceptCandidateId: string
): void {
  const candidates = getUsers().filter((user) => user.role === 'candidate');

  candidates.forEach((candidate) => {
    if (candidate.id === exceptCandidateId) return;

    const application = (candidate.applications ?? []).find(
      (entry) => entry.jobId === jobId && ACTIVE_COMPETING_STATUSES.includes(entry.status)
    );

    if (!application) return;

    updateUserApplicationStatus(candidate.id, application.id, 'rejected');
    addNotificationToUser(
      candidate.id,
      createNotification(
        'Role filled',
        `The position ${jobTitle} has been filled. Thank you for applying.`,
        'warning'
      )
    );
  });
}

export function hireCandidateForJob(params: {
  jobId: string;
  jobTitle: string;
  candidateId: string;
  applicationId: string;
}): User | null {
  const { jobId, jobTitle, candidateId, applicationId } = params;

  const hiredCandidate = updateUserApplicationStatus(candidateId, applicationId, 'hired');
  if (!hiredCandidate) return null;

  addNotificationToUser(
    candidateId,
    createNotification(
      'You are hired!',
      `Congratulations! You have been hired for ${jobTitle}.`,
      'success'
    )
  );

  updateJob(jobId, { status: 'closed' });
  rejectOtherApplicantsForJob(jobId, jobTitle, candidateId);

  return hiredCandidate;
}

export function extendOfferToCandidate(params: {
  candidateId: string;
  applicationId: string;
  jobTitle: string;
}): User | null {
  const { candidateId, applicationId, jobTitle } = params;
  const updated = updateUserApplicationStatus(candidateId, applicationId, 'offer');
  if (!updated) return null;

  addNotificationToUser(
    candidateId,
    createNotification(
      'Job offer received',
      `You received an offer for ${jobTitle}. Accept or decline from your dashboard.`,
      'success'
    )
  );

  return updated;
}

export function respondToOffer(params: {
  candidateId: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  accept: boolean;
}): User | null {
  const { candidateId, applicationId, jobId, jobTitle, accept } = params;
  const candidate = getUserById(candidateId);
  const application = candidate?.applications?.find((entry) => entry.id === applicationId);

  if (!application || application.status !== 'offer') {
    return null;
  }

  if (accept) {
    return hireCandidateForJob({
      jobId,
      jobTitle,
      candidateId,
      applicationId,
    });
  }

  const updated = updateUserApplicationStatus(candidateId, applicationId, 'declined');
  if (!updated) return null;

  addNotificationToUser(
    candidateId,
    createNotification('Offer declined', `You declined the offer for ${jobTitle}.`, 'info')
  );

  const job = getJobById(jobId);
  if (job?.postedById && candidate) {
    addNotificationToUser(
      job.postedById,
      createNotification(
        'Offer declined',
        `${candidate.firstName} ${candidate.lastName} declined the offer for ${jobTitle}.`,
        'warning'
      )
    );
  }

  return updated;
}

export function notifyEmployerOfWithdrawal(
  employerId: string,
  candidateName: string,
  jobTitle: string
): void {
  addNotificationToUser(
    employerId,
    createNotification(
      'Application withdrawn',
      `${candidateName} withdrew their application for ${jobTitle}.`,
      'info'
    )
  );
}

export function notifyCandidateOfStatusChange(
  candidateId: string,
  status: JobApplication['status'],
  jobTitle: string
): void {
  addNotificationToUser(
    candidateId,
    createNotification(
      status === 'hired' ? 'You are hired!' : 'Application update',
      getStatusNotificationMessage(status, jobTitle),
      status === 'rejected' || status === 'declined' ? 'warning' : 'success'
    )
  );
}
