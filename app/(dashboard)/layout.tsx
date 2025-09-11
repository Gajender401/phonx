"use client"
import React from 'react';
import Layout from '@/components/layout/Layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="bg-background min-h-screen">
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </Layout>
  );
} 