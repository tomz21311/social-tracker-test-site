'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { GlobalFiltersProvider } from '@/hooks/useGlobalFilters';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login page — no shell
  if (pathname === '/login' || !user) {
    return <>{children}</>;
  }

  // Authenticated — show full app shell
  return (
    <GlobalFiltersProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-[var(--sidebar-width)]">
          <TopBar />
          <main className="pt-[var(--topbar-height)] px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </GlobalFiltersProvider>
  );
}
