import { Briefcase, Clock, Home, Zap } from 'lucide-react';

interface JobBadgeProps {
  type?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  remote?: boolean;
  featured?: boolean;
  experience?: string;
  size?: 'sm' | 'md';
}

const typeConfig = {
  'full-time': { label: 'Full-time', className: 'badge-blue', icon: Briefcase },
  'part-time': { label: 'Part-time', className: 'badge-slate', icon: Clock },
  'contract': { label: 'Contract', className: 'badge-amber', icon: Zap },
  'freelance': { label: 'Freelance', className: 'badge-green', icon: Zap },
  'internship': { label: 'Internship', className: 'badge-green', icon: Briefcase },
};

export default function JobBadge({ type, remote, featured, experience, size = 'sm' }: JobBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <div className="flex flex-wrap gap-1.5">
      {featured && (
        <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses} bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200`}>
          <Zap className="w-3 h-3" />
          Featured
        </span>
      )}
      {type && typeConfig[type] && (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${typeConfig[type].className.replace('badge-', 'bg-').replace('blue', 'blue-50 text-blue-700').replace('slate', 'slate-100 text-slate-700').replace('amber', 'amber-50 text-amber-700').replace('green', 'emerald-50 text-emerald-700')}`}>
          {typeConfig[type].label}
        </span>
      )}
      {remote && (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} bg-teal-50 text-teal-700`}>
          <Home className="w-3 h-3" />
          Remote
        </span>
      )}
      {experience && (
        <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} bg-slate-100 text-slate-700`}>
          {experience.charAt(0).toUpperCase() + experience.slice(1)}
        </span>
      )}
    </div>
  );
}
