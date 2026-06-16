export interface Job {
  id: string;
  title: string;
  company: Company;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'year' | 'month' | 'hour';
  };
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  postedAt: string;
  expiresAt: string;
  applicants: number;
  views?: number;
  featured: boolean;
  remote: boolean;
  status: 'active' | 'paused' | 'closed';
  postedById?: string;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  website: string;
  description: string;
  location: string;
  founded: number;
  rating: number;
  reviewCount: number;
  openPositions: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: 'candidate' | 'employer' | 'admin';
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  skills: SkillEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  links: ProfileLinks;
  experience: WorkExperience[];
  education: Education[];
  appliedJobs: string[];
  savedJobs: string[];
  company?: Company;
  applications?: JobApplication[];
  notifications?: Notification[];
  interviews?: Interview[];
  createdAt: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface Interview {
  id: string;
  jobId: string;
  companyName: string;
  scheduledAt: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillEntry {
  name: string;
  level: SkillLevel;
}

export interface LanguageEntry {
  name: string;
  proficiency: 'basic' | 'conversational' | 'professional' | 'native';
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ProfileLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ApplicationProfileSnapshot {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  location?: string;
  phone?: string;
  bio?: string;
  skills: SkillEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  links: ProfileLinks;
  experience: WorkExperience[];
  education: Education[];
}

export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'declined';

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  appliedAt: string;
  resume?: string;
  coverLetter?: string;
  notes?: string;
  profileSnapshot?: ApplicationProfileSnapshot;
}

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplicants: number;
  newApplicants: number;
  views: number;
  inPipeline: number;
  offers: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export interface FilterOptions {
  query?: string;
  location?: string;
  type?: string[];
  experience?: string[];
  salary?: {
    min: number;
    max: number;
  };
  remote?: boolean;
  datePosted?: string;
  industry?: string[];
}