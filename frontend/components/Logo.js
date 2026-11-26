import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Logo({ href = '/' }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-cyan-500/30">
        <ShieldCheck className="h-5 w-5 text-white" />
      </span>
      <span className="text-lg text-white">
        Cyber<span className="text-cyan-400">Guard</span>
      </span>
    </Link>
  );
}
