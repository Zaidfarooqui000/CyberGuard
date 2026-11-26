import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata = {
  title: 'CyberGuard – Phishing Detection & Email Security',
  description: 'Analyze suspicious URLs and emails with transparent, rule-based phishing detection and learn how to stay safe online.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AuthProvider>{children}</AuthProvider>
        <div className="no-print pointer-events-none fixed bottom-3 right-3 z-50 select-none rounded-full border border-cyan-400/20 bg-navy-950/70 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-400 backdrop-blur">
          Created by <span className="text-cyan-300">Muhammad Zaid Farooqui</span>
        </div>
      </body>
    </html>
  );
}
