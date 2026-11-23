import { useState } from 'react';
import { LogOut, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Notice from '../components/common/Notice';
import { Spinner } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-300">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 truncate text-sm text-slate-100">{children}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, profileLimited, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <>
      <PageHeader title="Profile" description="Your account details." />

      {profileLimited && (
        <Notice tone="warn" className="mb-4">
          The backend does not expose <code className="rounded bg-black/30 px-1">GET /api/auth/me</code> yet, so only limited details are available. Add the small endpoint from <code className="rounded bg-black/30 px-1">backend_patch/README.md</code> to see your full profile.
        </Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-4 border-b border-white/[0.06] pb-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-lg font-semibold text-white">
              {initials(user?.full_name || user?.email)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white">{user?.full_name || 'Signed-in user'}</p>
              <p className="truncate text-sm text-slate-400">{user?.email || 'Email unavailable'}</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.05]">
            <Row icon={UserIcon} label="Full name">{user?.full_name || '—'}</Row>
            <Row icon={Mail} label="Email">{user?.email || '—'}</Row>
            <Row icon={ShieldCheck} label="Account status">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${user?.is_active ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30' : 'bg-rose-500/10 text-rose-300 ring-rose-500/30'}`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </Row>
          </div>
        </Card>

        <Card title="Session" subtitle="Sign out of this browser">
          <p className="mb-4 text-sm text-slate-400">
            Signing out revokes your refresh token on the server and clears the session from this browser.
          </p>
          <button type="button" onClick={onLogout} disabled={loggingOut} className="btn-ghost w-full !text-rose-300 hover:!bg-rose-500/10">
            {loggingOut ? <Spinner /> : <LogOut size={15} />} Log out
          </button>
        </Card>
      </div>
    </>
  );
}
