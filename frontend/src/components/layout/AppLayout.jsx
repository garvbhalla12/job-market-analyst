import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile drawer and scroll to top on navigation.
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-60">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
          {/* The AI Assistant page fills the screen and shows its own disclaimer */}
          {!pathname.startsWith('/assistant') && (
            <p className="mt-12 border-t border-white/[0.06] pt-5 text-center text-[11px] text-slate-500">
              Insights are based on a collected sample of job postings, not the entire job market.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
