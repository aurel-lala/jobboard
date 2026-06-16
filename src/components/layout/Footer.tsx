import { Link } from 'react-router-dom';
import { Briefcase, Mail, MapPin, Phone } from 'lucide-react';

const GithubIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.25" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3.5 6.7-.8 6.7-4.5 0-1-.4-1.9-1-2.6-.3-.7-.3-1.5 0-2.1.7-.6 1.1-1.5 1-2.4-.1-1-.9-1.8-2-2-.8-.1-1.6.2-2.1.8-.4.5-.6 1.1-.6 1.8 0 1.3-.8 2.4-2 2.8-.4.1-.7.4-.7.8v.1c0 .5.3.9.7 1.1 1.2.5 2 1.6 2 2.9 0 .9-.4 1.7-1 2.3-.3.3-.5.7-.5 1.2v4" />
    <path d="M9 18c-4.5 1.4-4.5-5.5-7-7" />
  </svg>
);
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">JobConnect</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-xs">
              Connecting exceptional talent with extraordinary opportunities. Find your dream job or hire the perfect candidate.
            </p>
            <div className="flex items-center gap-3">
             
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <GithubIcon />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* For Candidates */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              For Candidates
            </h3>
            <ul className="space-y-2.5">
              <li><Link to="/jobs" className="text-sm text-slate-400 hover:text-white transition-colors">Browse Jobs</Link></li>
              <li><Link to="/companies" className="text-sm text-slate-400 hover:text-white transition-colors">Browse Companies</Link></li>
              <li><Link to="/register" className="text-sm text-slate-400 hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/profile" className="text-sm text-slate-400 hover:text-white transition-colors">My Profile</Link></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Job Alerts</a></li>
            </ul>
          </div>

          {/* For Employers */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              For Employers
            </h3>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Post a Job</a></li>
              <li><Link to="/employer/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Enterprise</a></li>
              <li><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Recruiting Solutions</a></li>
            </ul>
          </div>

        

          {/* Contact */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-400">San Francisco, CA 94105</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-sm text-slate-400">hello@jobconnect.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-sm text-slate-400">+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              {new Date().getFullYear()} JobConnect. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
