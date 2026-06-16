import type { User, Notification, JobApplication, Interview } from '@/types';

export const AUTH_STORAGE_KEY = 'jobconnect_auth';
export const USERS_STORAGE_KEY = 'jobconnect_users';

export interface StoredUser extends User {
  password: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'candidate' | 'employer';
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

function stripPassword(user: StoredUser): User {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    localStorage.removeItem(USERS_STORAGE_KEY);
    return [];
  }
}

export function login(credentials: AuthCredentials): AuthResult {
  const users = getUsers();
  const user = users.find(
    (entry) =>
      entry.email.toLowerCase() === credentials.email.toLowerCase() &&
      entry.password === credentials.password
  );

  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  const safeUser = stripPassword(user);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeUser));
  return { success: true, user: safeUser };
}

export function register(data: RegisterData): AuthResult {
  const users = getUsers();

  if (users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) {
    return { success: false, error: 'An account with this email already exists' };
  }

  const newUser: StoredUser = {
    id: `u${Date.now()}`,
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    avatar: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=random`,
    role: data.role,
    skills: [],
    experience: [],
    education: [],
    appliedJobs: [],
    savedJobs: [],
    applications: [],
    notifications: [],
    interviews: [],
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));

  const safeUser = stripPassword(newUser);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeUser));

  return { success: true, user: safeUser };
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function updateUser(updates: Partial<User>): User | null {
  const current = getCurrentUser();
  if (!current) return null;

  const updated = { ...current, ...updates };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));

  const users = getUsers();
  const updatedUsers = users.map((user) =>
    user.id === current.id ? { ...user, ...updates } : user
  );
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

  return updated;
}

export function getUserById(userId: string): User | null {
  const user = getUsers().find((entry) => entry.id === userId);
  return user ? stripPassword(user) : null;
}

export function updateUserById(userId: string, updates: Partial<User>): User | null {
  const users = getUsers();
  let updatedUser: StoredUser | null = null;

  const updatedUsers = users.map((user) => {
    if (user.id === userId) {
      updatedUser = { ...user, ...updates };
      return updatedUser;
    }
    return user;
  });

  if (!updatedUser) return null;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

  const current = getCurrentUser();
  if (current?.id === userId) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stripPassword(updatedUser)));
  }

  return stripPassword(updatedUser);
}

export function addNotificationToUser(userId: string, notification: Notification): User | null {
  const user = getUserById(userId);
  if (!user) return null;
  return updateUserById(userId, {
    notifications: [...(user.notifications ?? []), notification],
  });
}

export function updateUserApplicationStatus(
  userId: string,
  applicationId: string,
  status: JobApplication['status']
): User | null {
  const user = getUserById(userId);
  if (!user) return null;

  const updatedApplications = (user.applications ?? []).map((application) =>
    application.id === applicationId ? { ...application, status } : application
  );

  return updateUserById(userId, { applications: updatedApplications });
}

export function addInterviewToUser(userId: string, interview: Interview): User | null {
  const user = getUserById(userId);
  if (!user) return null;
  return updateUserById(userId, {
    interviews: [...(user.interviews ?? []), interview],
  });
}

export function scheduleInterviewForCandidate(
  userId: string,
  applicationId: string,
  interview: Interview,
  status: JobApplication['status'] = 'interview_scheduled',
  notification?: Notification
): User | null {
  const user = getUserById(userId);
  if (!user) return null;

  const updatedApplications = (user.applications ?? []).map((application) =>
    application.id === applicationId ? { ...application, status } : application
  );

  return updateUserById(userId, {
    applications: updatedApplications,
    interviews: [...(user.interviews ?? []), interview],
    notifications: notification
      ? [...(user.notifications ?? []), notification]
      : (user.notifications ?? []),
  });
}
