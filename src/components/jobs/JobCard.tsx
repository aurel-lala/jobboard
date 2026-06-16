import { MapPin, DollarSign, Clock, Bookmark, BookmarkCheck, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Job } from '../../types';
import JobBadge from '../ui/JobBadge';
import { useAuth } from '@/contexts/AuthContext';

interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
}

function formatSalary(job: Job): string {
  const { min, max, currency, period } = job.salary;
  const symbol = currency === 'USD' ? '$' : currency;
  const suffix = period === 'year' ? '/yr' : period === 'month' ? '/mo' : '/hr';
  const format = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;
  return `${symbol}${format(min)} - ${symbol}${format(max)}${suffix}`;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function JobCard({ job, variant = 'default', index = 0 }: JobCardProps) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured' || job.featured;
  const saved = user?.savedJobs.includes(job.id) ?? false;

  const toggleSaved = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const updatedSavedJobs = saved
      ? user.savedJobs.filter((jobId) => jobId !== job.id)
      : [...user.savedJobs, job.id];

    updateUser({ savedJobs: updatedSavedJobs });
  };

  return (
    <div
      className={`
        group relative bg-white rounded-2xl border transition-all duration-300
        ${isFeatured 
          ? 'border-blue-200 shadow-md hover:shadow-xl hover:border-blue-300' 
          : 'border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300'
        }
        ${!isCompact ? 'hover:-translate-y-1' : ''}
        animate-fade-up
      `}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Featured stripe */}
      {isFeatured && (
        <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-blue-500 via-blue-400 to-teal-400 rounded-full" />
      )}
      
      <div className={`${isCompact ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className="flex gap-4">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            <div className={`${isCompact ? 'w-11 h-11' : 'w-13 h-13 sm:w-14 sm:h-14'} rounded-xl overflow-hidden border border-slate-100 bg-slate-50`}>
              <img
                src={job.company.logo}
                alt={job.company.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company.name)}&background=random`;
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/jobs/${job.id}`}
                  className="block group/title"
                >
                  <h3 className={`font-semibold text-slate-900 group-hover/title:text-blue-600 transition-colors truncate ${isCompact ? 'text-sm' : 'text-base'}`}>
                    {job.title}
                  </h3>
                </Link>
                <p className={`text-slate-500 truncate ${isCompact ? 'text-xs mt-0.5' : 'text-sm mt-1'}`}>
                  {job.company.name}
                </p>
              </div>

              {/* Save button */}
              <button
                onClick={toggleSaved}
                className={`
                  flex-shrink-0 p-2 rounded-lg transition-all duration-200
                  ${saved 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }
                `}
                aria-label={saved ? 'Remove from saved' : 'Save job'}
              >
                {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>

            {/* Badges */}
            <div className={`${isCompact ? 'mt-2' : 'mt-3'}`}>
              <JobBadge
                type={job.type}
                remote={job.remote}
                featured={job.featured}
                experience={job.experienceLevel}
                size={isCompact ? 'sm' : 'sm'}
              />
            </div>

            {/* Details */}
            {!isCompact && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  {formatSalary(job)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  {job.applicants} applicants
                </span>
              </div>
            )}

            {isCompact && (
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </span>
                <span className="font-medium text-slate-700">
                  {formatSalary(job)}
                </span>
              </div>
            )}

            {/* Footer */}
            <div className={`flex items-center justify-between ${isCompact ? 'mt-2 pt-2 border-t border-slate-100' : 'mt-4 pt-4 border-t border-slate-100'}`}>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {timeAgo(job.postedAt)}
              </span>
              <Link
                to={`/jobs/${job.id}`}
                className={`
                  font-medium transition-all duration-200
                  ${isCompact 
                    ? 'text-xs text-blue-600 hover:text-blue-700' 
                    : 'text-sm text-blue-600 hover:text-blue-700 hover:underline underline-offset-2'
                  }
                `}
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
