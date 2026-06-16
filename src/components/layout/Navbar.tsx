import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Building2,
  Home,
  PlusCircle,
  ClipboardList,
  Users,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, [location.pathname, refreshUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const notifications = user?.notifications ?? [];
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    if (!user) return;
    updateUser({
      notifications: notifications.map((n) => ({ ...n, read: true })),
    });
  };

  const markOneRead = (id: string) => {
    if (!user) return;
    updateUser({
      notifications: notifications.map((n) => n.id === id ? { ...n, read: true } : n),
    });
  };

  const isActive = (path: string, search?: string) => {
    if (path === '/') return location.pathname === '/';
    if (search !== undefined) {
      return location.pathname.startsWith(path) && location.search === search;
    }
    return location.pathname.startsWith(path);
  };

  const navLinkClasses = (path: string, search?: string) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path, search)
        ? 'text-blue-700 bg-blue-50'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  // ─── Role-based nav links ───────────────────────────────────────────────────

  const publicLinks = (
    <>
      <Link to="/" className={navLinkClasses('/')}>
        <Home className="w-4 h-4" />
        Home
      </Link>
      <Link to="/jobs" className={navLinkClasses('/jobs')}>
        <Search className="w-4 h-4" />
        Browse Jobs
      </Link>
      <Link to="/companies" className={navLinkClasses('/companies')}>
        <Building2 className="w-4 h-4" />
        Companies
      </Link>
    </>
  );

  const candidateLinks = (
    <>
      <Link to="/jobs" className={navLinkClasses('/jobs')}>
        <Search className="w-4 h-4" />
        Browse Jobs
      </Link>
      <Link to="/companies" className={navLinkClasses('/companies')}>
        <Building2 className="w-4 h-4" />
        Companies
      </Link>
      <Link to="/candidate/dashboard" className={navLinkClasses('/candidate/dashboard')}>
        <LayoutDashboard className="w-4 h-4" />
        Dashboard
      </Link>
    </>
  );

  const employerLinks = (
    <>
      <Link to="/employer/post-job" className={navLinkClasses('/employer/post-job')}>
        <PlusCircle className="w-4 h-4" />
        Post a Job
      </Link>
      <Link to="/employer/dashboard?tab=listings" className={navLinkClasses('/employer/dashboard', '?tab=listings')}>
        <ClipboardList className="w-4 h-4" />
        My Listings
      </Link>
      <Link to="/employer/dashboard?tab=applications" className={navLinkClasses('/employer/dashboard', '?tab=applications')}>
        <Users className="w-4 h-4" />
        Applications
      </Link>
      <Link to="/employer/dashboard" className={navLinkClasses('/employer/dashboard', '')}>
        <LayoutDashboard className="w-4 h-4" />
        Dashboard
      </Link>
    </>
  );

  const desktopNav =
    !user ? publicLinks :
    user.role === 'employer' ? employerLinks :
    candidateLinks;

  const mobileNav =
    !user ? publicLinks :
    user.role === 'employer' ? employerLinks :
    candidateLinks;

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-xl shadow-sm border-b border-slate-200/80'
          : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[var(--header-height)]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-blue">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent hidden sm:block">
              JobConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {desktopNav}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="View notifications"
                      className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute top-1 right-1 text-[0.55rem] font-semibold text-white bg-red-500 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>

                  <PopoverContent side="bottom" align="end" className="w-80">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-slate-900">Notifications</p>
                      {unreadNotificationsCount > 0 ? (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Mark all read
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">{notifications.length} total</span>
                      )}
                    </div>
                    {sortedNotifications.length === 0 ? (
                      <p className="text-sm text-slate-500">No notifications yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {sortedNotifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={`rounded-2xl border p-3 shadow-sm transition-colors ${
                              notification.read
                                ? 'border-slate-200 bg-white'
                                : 'border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100'
                            }`}
                            onClick={() => !notification.read && markOneRead(notification.id)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-slate-900">{notification.title}</p>
                              {notification.read ? (
                                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">Read</span>
                              ) : (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.65rem] font-semibold text-blue-700">New</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;
                      }}
                    />
                    <span className="hidden sm:block text-sm font-medium text-slate-700">
                      {user.firstName}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-down">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                          <span className={`inline-block mt-1.5 text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            user.role === 'employer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'employer' ? 'Employer' : 'Job Seeker'}
                          </span>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          Profile
                        </Link>
                
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white animate-fade-down">
          <nav className="px-4 py-3 space-y-1">
            {mobileNav}
            {user ? (
              <>
                <Link to="/profile" className={navLinkClasses('/profile')}>
                  <UserIcon className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <Link to="/login" className="text-center py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-center text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}