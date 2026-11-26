// Shared frame for the login and register pages.
import Navbar from './Navbar';

export default function AuthCard({ title, subtitle, children }) {
  return (
    <>
      <Navbar />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="card relative w-full max-w-md p-7 sm:p-8 animate-fade-up">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">{subtitle}</p>
          {children}
        </div>
      </main>
    </>
  );
}
