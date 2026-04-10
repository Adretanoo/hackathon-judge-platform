import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { Outlet } from '@tanstack/react-router';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex w-64 flex-col fixed inset-y-0" />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:pl-64 h-full">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="container mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
