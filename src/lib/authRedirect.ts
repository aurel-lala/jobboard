import type { User } from '@/types';

export function getDefaultRouteForUser(user: User): string {
  switch (user.role) {
    case 'employer':
      return '/employer/dashboard';
    case 'candidate':
      return '/candidate/dashboard';
    default:
      return '/';
  }
}

export function getPostAuthRedirect(user: User, fromPathname?: string): string {
  if (
    fromPathname &&
    fromPathname !== '/login' &&
    fromPathname !== '/register'
  ) {
    return fromPathname;
  }
  return getDefaultRouteForUser(user);
}
