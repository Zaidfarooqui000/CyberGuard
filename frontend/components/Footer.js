import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="no-print border-t border-navy-700/70 bg-navy-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-md text-sm text-slate-400">
            An educational Information Security project for phishing awareness. Results come from transparent rule-based
            analysis and cannot guarantee that any website or email is safe.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-slate-400">
          <Link href="/awareness" className="hover:text-cyan-300">Awareness</Link>
          <Link href="/login" className="hover:text-cyan-300">Log in</Link>
          <Link href="/register" className="hover:text-cyan-300">Register</Link>
        </div>
      </div>
      <p className="border-t border-navy-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CyberGuard – Phishing Detection & Email Security System
        <span className="mt-1 block text-slate-400">Created by Muhammad Zaid Farooqui</span>
      </p>
    </footer>
  );
}
