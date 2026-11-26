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
      </body>
    </html>
  );
}
