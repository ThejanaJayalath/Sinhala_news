import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth-server';
import { DashboardNavbar } from '@/components/dashboard-navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <DashboardNavbar />
      <main>{children}</main>
    </div>
  );
}

