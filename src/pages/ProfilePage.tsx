import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, Mail, Phone, Pencil, Briefcase,
  GraduationCap, Award, Save, Camera, Link2,
  Languages, FileDown, Plus, X, Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  User as UserType, WorkExperience, Education,
  SkillEntry, SkillLevel, LanguageEntry, CertificationEntry, ProfileLinks,
} from '@/types';

// ── Date validation helpers ───────────────────────────────────────────────────
function parseMonthYear(value: string): number | null {
  if (!value?.trim()) return null;
  const iso = value.match(/^(\d{4})-(\d{2})/);
  if (iso) return parseInt(iso[1]) * 100 + parseInt(iso[2]);
  const months: Record<string, number> = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
  };
  const parts = value.trim().split(/\s+/);
  if (parts.length === 2) {
    const mon = months[parts[0].toLowerCase().slice(0, 3)];
    const yr = parseInt(parts[1]);
    if (mon && !isNaN(yr)) return yr * 100 + mon;
  }
  const yr = parseInt(value.trim());
  if (!isNaN(yr) && yr > 1900) return yr * 100;
  return null;
}

function validateDateRange(start: string, end: string, current: boolean): string | null {
  if (!start) return 'Start date is required.';
  const s = parseMonthYear(start);
  if (!s) return 'Start date format is not valid (e.g. Jan 2023).';
  if (!current && end) {
    const e = parseMonthYear(end);
    if (!e) return 'End date format is not valid (e.g. Jun 2024).';
    if (e < s) return 'End date cannot be before start date.';
  }
  return null;
}

// ── Skill level helpers ───────────────────────────────────────────────────────
const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const SKILL_LEVEL_COLORS: Record<SkillLevel, string> = {
  beginner:     'bg-slate-100 text-slate-600',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced:     'bg-indigo-100 text-indigo-700',
  expert:       'bg-violet-100 text-violet-700',
};
const SKILL_LEVEL_BARS: Record<SkillLevel, number> = {
  beginner: 1, intermediate: 2, advanced: 3, expert: 4,
};

// Normalize legacy string[] skills to SkillEntry[]
function normalizeSkills(skills: unknown[]): SkillEntry[] {
  return skills.map((s) =>
    typeof s === 'string' ? { name: s, level: 'intermediate' as SkillLevel } : s as SkillEntry
  );
}

// ── Input class ───────────────────────────────────────────────────────────────
const inp = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

// ── PDF Export ────────────────────────────────────────────────────────────────
function exportCVasPDF(user: UserType) {
  const html = buildCVHtml(user);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

function buildCVHtml(u: UserType): string {
  const skills = (u.skills ?? []).map((s) =>
    `<span class="skill-pill ${s.level}">${s.name} <span class="lvl">${s.level}</span></span>`
  ).join('');

  const experience = (u.experience ?? []).map((e) => `
    <div class="item">
      <div class="item-header">
        <strong>${e.title}</strong> — ${e.company}
        <span class="meta">${e.startDate} – ${e.current ? 'Present' : e.endDate ?? ''} &bull; ${e.location}</span>
      </div>
      ${e.description ? `<p class="desc">${e.description}</p>` : ''}
    </div>`).join('');

  const education = (u.education ?? []).map((e) => `
    <div class="item">
      <div class="item-header">
        <strong>${e.institution}</strong>
        <span class="meta">${e.startDate} – ${e.current ? 'Present' : e.endDate ?? ''}</span>
      </div>
      <p class="desc">${e.degree}${e.field ? ' in ' + e.field : ''}</p>
    </div>`).join('');

  const languages = (u.languages ?? []).map((l) =>
    `<span class="lang-pill">${l.name} <span class="lvl">${l.proficiency}</span></span>`
  ).join('');

  const certs = (u.certifications ?? []).map((c) => `
    <div class="item">
      <strong>${c.name}</strong> — ${c.issuer}
      <span class="meta">${c.date}${c.url ? ` &bull; <a href="${c.url}">${c.url}</a>` : ''}</span>
    </div>`).join('');

  const links = u.links ?? {};
  const linkItems = [
    links.linkedin ? `<a href="${links.linkedin}">LinkedIn</a>` : '',
    links.github   ? `<a href="${links.github}">GitHub</a>` : '',
    links.portfolio? `<a href="${links.portfolio}">Portfolio</a>` : '',
  ].filter(Boolean).join(' &bull; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${u.firstName} ${u.lastName} — CV</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 32px 40px; max-width: 780px; margin: auto; }
  h1 { font-size: 24px; font-weight: 700; }
  .subtitle { color: #64748b; margin-top: 4px; }
  .contact { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 12px; color: #475569; }
  .contact a { color: #2563eb; text-decoration: none; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 18px 0; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2563eb; margin-bottom: 10px; }
  .item { margin-bottom: 12px; }
  .item-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; }
  .meta { font-size: 11px; color: #94a3b8; }
  .desc { color: #475569; margin-top: 3px; font-size: 12px; }
  .skill-pill, .lang-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; margin: 2px 3px; background: #f1f5f9; }
  .skill-pill.expert { background: #ede9fe; color: #5b21b6; }
  .skill-pill.advanced { background: #e0e7ff; color: #3730a3; }
  .skill-pill.intermediate { background: #dbeafe; color: #1d4ed8; }
  .skill-pill.beginner { background: #f8fafc; color: #64748b; }
  .lang-pill { background: #f0fdf4; color: #166534; }
  .lvl { font-size: 10px; opacity: 0.7; }
  @media print {
    body { padding: 16px 20px; }
    a { color: #2563eb !important; text-decoration: none; }
  }
</style>
</head>
<body>
  <h1>${u.firstName} ${u.lastName}</h1>
  ${u.headline ? `<p class="subtitle">${u.headline}</p>` : ''}
  <div class="contact">
    ${u.email ? `<span>${u.email}</span>` : ''}
    ${u.phone  ? `<span>${u.phone}</span>` : ''}
    ${u.location ? `<span>${u.location}</span>` : ''}
    ${linkItems ? `<span>${linkItems}</span>` : ''}
  </div>
  ${u.bio ? `<hr class="divider"/><p>${u.bio}</p>` : ''}

  ${experience ? `<hr class="divider"/><h2>Experience</h2>${experience}` : ''}
  ${education  ? `<hr class="divider"/><h2>Education</h2>${education}` : ''}

  ${skills ? `<hr class="divider"/><h2>Skills</h2><div>${skills}</div>` : ''}
  ${languages ? `<hr class="divider"/><h2>Languages</h2><div>${languages}</div>` : ''}
  ${certs     ? `<hr class="divider"/><h2>Certifications</h2>${certs}` : ''}
</body>
</html>`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserType>>({});

  // sub-form states
  const [newSkill, setNewSkill]         = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');
  const [expDateError, setExpDateError] = useState<string | null>(null);
  const [eduDateError, setEduDateError] = useState<string | null>(null);
  const [newExperience, setNewExperience] = useState<Partial<WorkExperience>>({
    title:'', company:'', location:'', startDate:'', endDate:'', current:false, description:'',
  });
  const [newEducation, setNewEducation] = useState<Partial<Education>>({
    institution:'', degree:'', field:'', startDate:'', endDate:'', current:false,
  });
  const [newLang, setNewLang]           = useState('');
  const [newLangProf, setNewLangProf]   = useState<LanguageEntry['proficiency']>('professional');
  const [newCert, setNewCert]           = useState<Partial<CertificationEntry>>({
    name:'', issuer:'', date:'', url:'',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
  }, [user, navigate]);

  if (!user) return null;

  const fd = isEditing ? formData : user;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (patch: Partial<UserType>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const handleStartEditing = () => { setFormData({ ...user, skills: normalizeSkills(user.skills ?? []) }); setIsEditing(true); };
  const handleSave = () => {
    const updated = updateUser(formData);
    if (updated) { setFormData(updated); setIsEditing(false); }
  };
  const handleCancel = () => { setIsEditing(false); setFormData({}); };

  // Avatar upload (base64)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  // Skills
  const addSkill = () => {
    const name = newSkill.trim();
    if (!name) return;
    const existing = normalizeSkills(formData.skills ?? user.skills ?? []);
    if (existing.find((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    set({ skills: [...existing, { name, level: newSkillLevel }] });
    setNewSkill('');
  };
  const removeSkill = (name: string) =>
    set({ skills: normalizeSkills(formData.skills ?? []).filter((s) => s.name !== name) });

  // Experience
  const addExperience = () => {
    const item: WorkExperience = {
      id: `exp-${Date.now()}`,
      title: newExperience.title?.trim() ?? '',
      company: newExperience.company?.trim() ?? '',
      location: newExperience.location?.trim() ?? '',
      startDate: newExperience.startDate?.trim() ?? '',
      endDate: newExperience.endDate?.trim() ?? '',
      current: !!newExperience.current,
      description: newExperience.description?.trim() ?? '',
    };
    if (!item.title || !item.company) return;
    const err = validateDateRange(item.startDate, item.endDate ?? '', item.current);
    if (err) { setExpDateError(err); return; }
    setExpDateError(null);
    set({ experience: [...(formData.experience ?? user.experience ?? []), item] });
    setNewExperience({ title:'', company:'', location:'', startDate:'', endDate:'', current:false, description:'' });
  };
  const removeExperience = (id: string) =>
    set({ experience: (formData.experience ?? []).filter((e) => e.id !== id) });

  // Education
  const addEducation = () => {
    const item: Education = {
      id: `edu-${Date.now()}`,
      institution: newEducation.institution?.trim() ?? '',
      degree: newEducation.degree?.trim() ?? '',
      field: newEducation.field?.trim() ?? '',
      startDate: newEducation.startDate?.trim() ?? '',
      endDate: newEducation.endDate?.trim() ?? '',
      current: !!newEducation.current,
    };
    if (!item.institution || !item.degree) return;
    const err = validateDateRange(item.startDate, item.endDate ?? '', item.current);
    if (err) { setEduDateError(err); return; }
    setEduDateError(null);
    set({ education: [...(formData.education ?? user.education ?? []), item] });
    setNewEducation({ institution:'', degree:'', field:'', startDate:'', endDate:'', current:false });
  };
  const removeEducation = (id: string) =>
    set({ education: (formData.education ?? []).filter((e) => e.id !== id) });

  // Languages
  const addLanguage = () => {
    const name = newLang.trim();
    if (!name) return;
    const existing = (formData.languages ?? user.languages ?? []) as LanguageEntry[];
    if (existing.find((l) => l.name.toLowerCase() === name.toLowerCase())) return;
    set({ languages: [...existing, { name, proficiency: newLangProf }] });
    setNewLang('');
  };
  const removeLang = (name: string) =>
    set({ languages: ((formData.languages ?? []) as LanguageEntry[]).filter((l) => l.name !== name) });

  // Certifications
  const addCert = () => {
    if (!newCert.name?.trim() || !newCert.issuer?.trim()) return;
    const item: CertificationEntry = {
      id: `cert-${Date.now()}`,
      name: newCert.name.trim(),
      issuer: newCert.issuer.trim(),
      date: newCert.date?.trim() ?? '',
      url: newCert.url?.trim() || undefined,
    };
    set({ certifications: [...(formData.certifications ?? user.certifications ?? []), item] });
    setNewCert({ name:'', issuer:'', date:'', url:'' });
  };
  const removeCert = (id: string) =>
    set({ certifications: (formData.certifications ?? []).filter((c) => c.id !== id) });

  // Links
  const setLink = (key: keyof ProfileLinks, val: string) =>
    set({ links: { ...(formData.links ?? user.links ?? {}), [key]: val || undefined } });

  // ── Data aliases ──────────────────────────────────────────────────────────
  const skills        = normalizeSkills(fd.skills ?? []);
  const experience    = (fd.experience      ?? []) as WorkExperience[];
  const education     = (fd.education       ?? []) as Education[];
  const languages     = (fd.languages       ?? []) as LanguageEntry[];
  const certifications= (fd.certifications  ?? []) as CertificationEntry[];
  const links         = (fd.links           ?? {}) as ProfileLinks;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 flex flex-col sm:flex-row items-start gap-6">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-slate-100">
                <img
                  src={(isEditing ? formData.avatar : user.avatar) || user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;
                  }}
                />
              </div>
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="w-full">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {user.firstName} {user.lastName}
                  </h1>

                  {isEditing ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(['headline','location','phone'] as const).map((field) => (
                        <label key={field} className="block text-sm text-slate-600 capitalize">
                          {field}
                          <input
                            value={(formData[field] as string) || ''}
                            onChange={(e) => set({ [field]: e.target.value })}
                            className={inp}
                            placeholder={field === 'headline' ? 'e.g. Frontend Developer' : field === 'location' ? 'City, Country' : '+1 555 0000'}
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      {user.headline && <p className="text-slate-500 mt-1">{user.headline}</p>}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                        {user.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-400" />{user.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-slate-400" />{user.email}
                        </span>
                        {user.phone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-slate-400" />{user.phone}
                          </span>
                        )}
                        {links.linkedin && (
                          <a href={links.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                            <Link2 className="w-4 h-4" />LinkedIn
                          </a>
                        )}
                        {links.github && (
                          <a href={links.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                            <Link2 className="w-4 h-4" />GitHub
                          </a>
                        )}
                        {links.portfolio && (
                          <a href={links.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                            <Link2 className="w-4 h-4" />Portfolio
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isEditing && user.role === 'candidate' && (
                    <button
                      type="button"
                      onClick={() => exportCVasPDF(user)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      Export CV
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => isEditing ? handleSave() : handleStartEditing()}
                    className={isEditing ? 'btn-primary' : 'btn-secondary'}
                  >
                    {isEditing ? <><Save className="w-4 h-4" />Save</> : <><Pencil className="w-4 h-4" />Edit</>}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={handleCancel} className="btn-secondary">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'candidate' ? 'bg-blue-50 text-blue-700'
                  : user.role === 'employer' ? 'bg-purple-50 text-purple-700'
                  : 'bg-slate-100 text-slate-700'
                }`}>
                  <User className="w-3 h-3" />
                  {user.role === 'candidate' ? 'Job Seeker' : user.role === 'employer' ? 'Employer' : 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <Section icon={<User className="w-5 h-5 text-blue-600" />} title="About">
              {isEditing ? (
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => set({ bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className={`${inp} min-h-[120px] resize-none`}
                />
              ) : (
                <p className="text-slate-600 leading-relaxed">
                  {user.bio || 'No bio added yet. Click edit to add your bio.'}
                </p>
              )}
            </Section>

            {/* Links */}
            {(isEditing || links.linkedin || links.github || links.portfolio) && (
              <Section icon={<Link2 className="w-5 h-5 text-blue-600" />} title="Links">
                {isEditing ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {(['linkedin','github','portfolio'] as const).map((key) => (
                      <label key={key} className="block text-sm text-slate-600 capitalize">
                        {key}
                        <input
                          value={(formData.links?.[key]) || ''}
                          onChange={(e) => setLink(key, e.target.value)}
                          className={inp}
                          placeholder={`https://${key === 'linkedin' ? 'linkedin.com/in/you' : key === 'github' ? 'github.com/you' : 'yoursite.com'}`}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {(['linkedin','github','portfolio'] as const).filter((k) => links[k]).map((k) => (
                      <a key={k} href={links[k]} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors capitalize">
                        <Link2 className="w-4 h-4" />{k}
                      </a>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Experience */}
            <Section icon={<Briefcase className="w-5 h-5 text-blue-600" />} title="Experience">
              {experience.length > 0 ? (
                <div className="space-y-5">
                  {experience.map((exp) => (
                    <div key={exp.id} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                            <p className="text-sm text-slate-600">{exp.company}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {exp.startDate} – {exp.current ? 'Present' : exp.endDate} &middot; {exp.location}
                            </p>
                          </div>
                          {isEditing && (
                            <button type="button" onClick={() => removeExperience(exp.id)}
                              className="text-sm text-red-500 hover:text-red-700">Remove</button>
                          )}
                        </div>
                        {exp.description && <p className="text-sm text-slate-600 mt-1">{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500 italic">No experience added yet.</p>}

              {isEditing && (
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                  <p className="text-sm font-medium text-slate-700">Add experience</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[['title','Title','Senior Developer'],['company','Company','Acme Corp'],['location','Location','Remote'],['startDate','Start Date','Jan 2023'],['endDate','End Date','Jun 2024 or leave blank']].map(([k,label,ph]) => (
                      <label key={k} className="block text-sm text-slate-600">
                        {label}
                        <input value={(newExperience as Record<string,string>)[k] || ''} onChange={(e) => setNewExperience((p) => ({ ...p, [k]: e.target.value }))} className={inp} placeholder={ph} />
                      </label>
                    ))}
                    <label className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                      <input type="checkbox" checked={!!newExperience.current} onChange={(e) => setNewExperience((p) => ({ ...p, current: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                      Current role
                    </label>
                  </div>
                  <label className="block text-sm text-slate-600">
                    Description
                    <textarea value={newExperience.description || ''} onChange={(e) => setNewExperience((p) => ({ ...p, description: e.target.value }))} className={`${inp} min-h-[80px] resize-none`} placeholder="Describe your responsibilities." />
                  </label>
                  <button type="button" onClick={addExperience} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Experience</button>
                  {expDateError && <p className="text-sm text-red-600">{expDateError}</p>}
                </div>
              )}
            </Section>

            {/* Education */}
            <Section icon={<GraduationCap className="w-5 h-5 text-blue-600" />} title="Education">
              {education.length > 0 ? (
                <div className="space-y-5">
                  {education.map((edu) => (
                    <div key={edu.id} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">{edu.institution}</h3>
                            <p className="text-sm text-slate-600">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</p>
                          </div>
                          {isEditing && (
                            <button type="button" onClick={() => removeEducation(edu.id)} className="text-sm text-red-500 hover:text-red-700">Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500 italic">No education added yet.</p>}

              {isEditing && (
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                  <p className="text-sm font-medium text-slate-700">Add education</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[['institution','Institution','University of Example'],['degree','Degree','B.Sc. Computer Science'],['field','Field','Software Engineering'],['startDate','Start Date','Sep 2020'],['endDate','End Date','Jun 2024']].map(([k,label,ph]) => (
                      <label key={k} className="block text-sm text-slate-600">
                        {label}
                        <input value={(newEducation as Record<string,string>)[k] || ''} onChange={(e) => setNewEducation((p) => ({ ...p, [k]: e.target.value }))} className={inp} placeholder={ph} />
                      </label>
                    ))}
                    <label className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                      <input type="checkbox" checked={!!newEducation.current} onChange={(e) => setNewEducation((p) => ({ ...p, current: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                      Current study
                    </label>
                  </div>
                  <button type="button" onClick={addEducation} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Education</button>
                  {eduDateError && <p className="text-sm text-red-600">{eduDateError}</p>}
                </div>
              )}
            </Section>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">

            {/* Skills */}
            <Section icon={<Award className="w-5 h-5 text-blue-600" />} title="Skills">
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s.name} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${SKILL_LEVEL_COLORS[s.level]}`}>
                      <span className="flex gap-0.5">
                        {[1,2,3,4].map((n) => (
                          <span key={n} className={`w-1 h-1 rounded-full ${n <= SKILL_LEVEL_BARS[s.level] ? 'bg-current' : 'bg-current opacity-25'}`} />
                        ))}
                      </span>
                      {s.name}
                      {isEditing && (
                        <button type="button" onClick={() => removeSkill(s.name)} className="ml-1 opacity-60 hover:opacity-100">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500 italic">No skills added yet.</p>}

              {isEditing && (
                <div className="mt-4 space-y-2">
                  <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill()} placeholder="React, TypeScript..." className={inp} />
                  <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)} className={inp}>
                    {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                  <button type="button" onClick={addSkill} className="btn-primary w-full inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add Skill</button>
                </div>
              )}
            </Section>

            {/* Languages */}
            <Section icon={<Languages className="w-5 h-5 text-blue-600" />} title="Languages">
              {languages.length > 0 ? (
                <div className="space-y-2">
                  {languages.map((l) => (
                    <div key={l.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{l.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 capitalize">{l.proficiency}</span>
                        {isEditing && (
                          <button type="button" onClick={() => removeLang(l.name)} className="opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500 italic">No languages added yet.</p>}

              {isEditing && (
                <div className="mt-4 space-y-2">
                  <input value={newLang} onChange={(e) => setNewLang(e.target.value)} placeholder="English, Albanian..." className={inp} />
                  <select value={newLangProf} onChange={(e) => setNewLangProf(e.target.value as LanguageEntry['proficiency'])} className={inp}>
                    {(['basic','conversational','professional','native'] as const).map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addLanguage} className="btn-primary w-full inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add Language</button>
                </div>
              )}
            </Section>

            {/* Certifications */}
            <Section icon={<Star className="w-5 h-5 text-blue-600" />} title="Certifications">
              {certifications.length > 0 ? (
                <div className="space-y-3">
                  {certifications.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.issuer} &middot; {c.date}</p>
                        {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View credential</a>}
                      </div>
                      {isEditing && (
                        <button type="button" onClick={() => removeCert(c.id)} className="opacity-50 hover:opacity-100 flex-shrink-0"><X className="w-3 h-3" /></button>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500 italic">No certifications added yet.</p>}

              {isEditing && (
                <div className="mt-4 space-y-2">
                  <input value={newCert.name || ''} onChange={(e) => setNewCert((p) => ({ ...p, name: e.target.value }))} placeholder="AWS Solutions Architect" className={inp} />
                  <input value={newCert.issuer || ''} onChange={(e) => setNewCert((p) => ({ ...p, issuer: e.target.value }))} placeholder="Amazon Web Services" className={inp} />
                  <input value={newCert.date || ''} onChange={(e) => setNewCert((p) => ({ ...p, date: e.target.value }))} placeholder="Jun 2024" className={inp} />
                  <input value={newCert.url || ''} onChange={(e) => setNewCert((p) => ({ ...p, url: e.target.value }))} placeholder="https://credential.url (optional)" className={inp} />
                  <button type="button" onClick={addCert} className="btn-primary w-full inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add Certification</button>
                </div>
              )}
            </Section>

          </aside>
        </div>
      </div>
    </div>
  );
}

// ── Small helper component ───────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        {icon}{title}
      </h2>
      {children}
    </div>
  );
}