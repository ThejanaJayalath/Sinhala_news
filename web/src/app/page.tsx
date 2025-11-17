import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth-server';

export default async function Home() {
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
