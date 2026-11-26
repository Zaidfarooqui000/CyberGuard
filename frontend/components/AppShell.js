'use client';

// Sidebar layout used by /dashboard and /admin pages.
// Also acts as the route guard: redirects to /login if not signed in,
// and away from admin pages if the user is not an admin.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Link2, Mail, History, User, BookOpen, LogOut, Menu, X,
  Users, ScanLine, Lightbulb, Activity, ShieldCheck, LoaderCircle,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '@/lib/AuthContext';

const userLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/scan-url', label: 'URL Scanner', icon: Link2 },
  { href: '/dashboard/scan-email', label: 'Email Scanner', icon: Mail },
  { href: '/dashboard/history', label: 'Scan History', icon: History },
  { href: '/awareness', label: 'Awareness', icon: BookOpen },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { href: '/admin', label: 'Admin Overview', icon: ShieldCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/scans', label: 'All Scans', icon: ScanLine },
  { href: '/admin/tips', label: 'Security Tips', icon: Lightbulb },
  { href: '/admin/logs', label: 'Activity Logs', icon: Activity },
];

function NavLink({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30'
          : 'text-slate-300 hover:bg-navy-800 hover:text-white'
      }`}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {item.label}
    </Link>
  );
}

export default function AppShell({ children, adminOnly = false }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (adminOnly && user.role !== 'admin') router.replace('/dashboard');
  }, [user, loading, adminOnly, router, pathname]);

  if (loading || !user || (adminOnly && user.role !== 'admin')) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        <LoaderCircle className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const isActive = (href) =>
    href === '/dashboard' || href === '/admin' ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Logo href={user.role === 'admin' ? '/admin' : '/dashboard'} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Security tools</p>
        {userLinks.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={() => setOpen(false)} />
        ))}
        {user.role === 'admin' && (
          <>
            <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Administration</p>
            {adminLinks.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={() => setOpen(false)} />
            ))}
          </>
        )}
      </nav>
      <div className="border-t border-navy-700 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-cyan-500/15 font-semibold text-cyan-300">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs capitalize text-slate-400">{user.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-secondary w-full">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-navy-700 bg-navy-900 lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar (drawer) */}
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-navy-700 bg-navy-900 animate-fade-up">
            <button className="absolute right-3 top-5 rounded-lg p-1 text-slate-400 hover:text-white" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-navy-700 bg-navy-950/85 px-4 py-3 backdrop-blur lg:hidden">
          <Logo href={user.role === 'admin' ? '/admin' : '/dashboard'} />
          <button className="rounded-lg p-2 text-slate-300 hover:bg-navy-800" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
