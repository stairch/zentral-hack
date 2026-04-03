'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Rolle</h3>
            <p className="text-lg capitalize">{user.role}</p>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">User ID</h3>
            <p className="text-sm text-muted-foreground break-all">{user.id}</p>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="text-green-600">✓ Eingeloggt</p>
          </div>
        </div>

        {(user.role === 'admin' || user.role === 'category_partner') && (
          <div className="mt-8 p-4 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
            <div className="flex gap-2 flex-wrap">
              <Link href="/admin">
                <Button variant="default">Admin Dashboard</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
