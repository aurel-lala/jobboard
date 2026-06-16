import { useState, useEffect, type FormEvent } from 'react';
import { Search, MapPin } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, location: string) => void;
  variant?: 'hero' | 'default';
  initialQuery?: string;
  initialLocation?: string;
}

export default function SearchBar({ onSearch, variant = 'default', initialQuery = '', initialLocation = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query, location);
  };

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        flex flex-col sm:flex-row gap-2 sm:gap-0 rounded-2xl transition-all duration-300
        ${isHero
          ? 'bg-white/95 backdrop-blur-sm shadow-xl border border-white/50 p-2'
          : 'bg-white shadow-md border border-slate-200 p-2'
        }
      `}
    >
      {/* Job Query */}
      <div className="flex-1 flex items-center gap-3 px-4 py-2.5 min-w-0">
        <Search className={`w-5 h-5 flex-shrink-0 ${isHero ? 'text-blue-500' : 'text-slate-400'}`} />
        <input
          type="text"
          placeholder="Job title, keywords, or company"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px bg-slate-200 self-stretch my-2" />

      {/* Location */}
      <div className="flex-1 flex items-center gap-3 px-4 py-2.5 min-w-0">
        <MapPin className={`w-5 h-5 flex-shrink-0 ${isHero ? 'text-blue-500' : 'text-slate-400'}`} />
        <input
          type="text"
          placeholder="City, state, or remote"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={`
          flex items-center justify-center gap-2 font-semibold text-sm rounded-xl transition-all duration-200
          ${isHero
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 shadow-blue hover:shadow-blue-lg'
            : 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3'
          }
          hover:-translate-y-0.5 active:translate-y-0
        `}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
