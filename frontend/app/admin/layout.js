import AppShell from '@/components/AppShell';

// adminOnly: non-admin users are redirected to /dashboard.
// (The API also checks the role on every admin request.)
export default function AdminLayout({ children }) {
  return <AppShell adminOnly>{children}</AppShell>;
}
