'use client'
import React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { useApp } from '@/context/GlobalContext';
import { PageLoader } from '../Loader';
import GlobalLoader from '../GlobalLoader';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isSidebarCollapsed, authLoading, isAuthenticated } = useApp();

  // Show loading spinner while checking authentication
  if (authLoading) {
          return (
        <PageLoader 
          useCustomLogo={true}
        />
      );
  }

  // If not authenticated, don't show the sidebar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <GlobalLoader />
      <Sidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          isSidebarCollapsed ? "ml-20" : "ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
