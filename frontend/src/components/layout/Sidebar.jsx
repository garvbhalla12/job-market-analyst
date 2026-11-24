import { Link, NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { NAV_SECTIONS } from './navItems';
import Logo from './Logo';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const name = user?.full_name || 'Account';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/[0.07] bg-ink-950/95 backdrop-blur transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
          <Link to="/dashboard" onClick={onClose} className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50">
            <Logo size={26} />
          </Link>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="scrollbar-none flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon, badge }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                          isActive
                            ? 'bg-white/[0.07] text-white'
                            : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-purple to-brand-blue" aria-hidden="true" />
                          )}
                          <Icon size={16} className={isActive ? 'text-violet-300' : 'text-slate-500 group-hover:text-slate-300'} />
                          <span className="flex-1 truncate">{label}</span>
                          {badge && (
                            <span className="rounded-full border border-brand-purple/30 bg-brand-purple/15 px-1.5 py-px text-[10px] font-semibold text-violet-200">
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Signed-in user */}
        <div className="shrink-0 border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
            <Link to="/profile" onClick={onClose} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md hover:opacity-90">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-[11px] font-semibold text-white">
                {initials(user?.full_name || user?.email)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-slate-100">{name}</span>
                {user?.email && <span className="block truncate text-[11px] text-slate-500">{user.email}</span>}
              </span>
            </Link>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="shrink-0 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
