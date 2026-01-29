import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Claude Transcript Viewer
          </h1>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-white shadow-sm">
          <div className="p-4">
            {/* Sidebar content will go here */}
          </div>
        </aside>

        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default Layout;
