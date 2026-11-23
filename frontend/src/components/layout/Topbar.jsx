import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';

export default function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const current = NAV_ITEMS.find((i) => pathname.startsWith(i.to));

  // Clear the quick-search box when the user navigates around.
  useEffect(() => {
    if (!pathname.startsWith('/jobs')) setQuery('');
  }, [pathname]);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/jobs?search=${encodeURIComponent(q)}` : '/jobs');
  };

  const displayName = user?.full_name || user?.email || 'Account';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/10 bg-ink-900/80 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onMenu} className="rounded-md p-2 text-slate-300 hover:bg-white/10 lg:hidden" aria-label="Open menu">
        <Menu size={20} />
      </button>

      <h2 className="min-w-0 truncate text-sm font-semibold text-white sm:text-base">{current?.title ?? 'Job Market Analyst'}</h2>

      <form onSubmit={submit} role="search" className="ml-auto hidden w-full max-w-xs md:block">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs by title or company"
            aria-label="Search jobs"
            className="input !pl-9"
          />
        </div>
      </form>

      <Link
        to="/profile"
        className="ml-auto flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5 md:ml-0"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-xs font-semibold text-white">
          {initials(user?.full_name || user?.email)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm text-slate-200 sm:block">{displayName}</span>
      </Link>
    </header>
  );
}
