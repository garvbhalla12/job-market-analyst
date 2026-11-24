import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Menu, Search } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';

export default function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  const current = NAV_ITEMS.find((i) => pathname.startsWith(i.to));

  // Clear the quick-search box when the user navigates around.
  useEffect(() => {
    if (!pathname.startsWith('/jobs')) setQuery('');
  }, [pathname]);

  // Press "/" anywhere (outside a text field) to jump to the search box.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable) return;
      if (!searchRef.current || searchRef.current.offsetParent === null) return; // hidden on small screens
      e.preventDefault();
      searchRef.current.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/jobs?search=${encodeURIComponent(q)}` : '/jobs');
    searchRef.current?.blur();
  };

  const displayName = user?.full_name || user?.email || 'Account';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/[0.07] bg-ink-900/75 px-4 backdrop-blur-md sm:px-6">
      <button type="button" onClick={onMenu} className="-ml-1 rounded-md p-2 text-slate-300 hover:bg-white/10 lg:hidden" aria-label="Open menu">
        <Menu size={19} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="hidden text-slate-500 sm:inline">{current?.section ?? 'Job Market Analyst'}</span>
        <ChevronRight size={14} className="hidden shrink-0 text-slate-600 sm:block" />
        <span className="truncate font-medium text-slate-100">{current?.title ?? 'Job Market Analyst'}</span>
      </nav>

      <form onSubmit={submit} role="search" className="ml-auto hidden w-full max-w-[18rem] md:block">
        <div className="group relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs or companies…"
            aria-label="Search jobs"
            className="input !h-9 !border-white/[0.08] !bg-white/[0.03] !py-0 !pl-8 !pr-9 !text-[13px] hover:!border-white/15"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 font-sans text-[10px] leading-4 text-slate-400 group-focus-within:hidden">
            /
          </kbd>
        </div>
      </form>

      <Link
        to="/profile"
        title={displayName}
        className="ml-auto flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-white/5 md:ml-0 sm:rounded-lg sm:py-1 sm:pl-1 sm:pr-2.5"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-[11px] font-semibold text-white">
          {initials(user?.full_name || user?.email)}
        </span>
        <span className="hidden max-w-[9rem] truncate text-[13px] font-medium text-slate-200 sm:block">{displayName}</span>
      </Link>
    </header>
  );
}
