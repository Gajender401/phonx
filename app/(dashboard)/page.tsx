"use client"
import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import CallsChart from '@/components/dashboard/CallsChart';
import WeeklyCallsCard from '@/components/dashboard/WeeklyCallsCard';
import MissedCallsChart from '@/components/dashboard/MissedCallsChart';
import EscalatedCallsCard from '@/components/dashboard/EscalatedCallsCard';
import ClaireChart from '@/components/dashboard/ClaireChart';
import BrandFilter from '@/components/dashboard/BrandFilter';
import MonthFilter from '@/components/dashboard/MonthFilter';
import WeekFilter from '@/components/dashboard/WeekFilter';
import StatCards from '@/components/dashboard/StatCards';
import AdminStatCards from '@/components/dashboard/AdminStatCards';
import BrandInfoCard from '@/components/dashboard/BrandInfoCard';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useApp } from '@/context/GlobalContext';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, useLoadingStore, complaintsApi, type ComplaintsResponse } from '@/lib/api';

// Define API response types
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
}

type DashboardStats = {
  totalCalls: number;
  missedCalls: number;
  averageHandlingTime: number;
  satisfactionRate: number;
}

type CallsData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

type MissedCallsData = {
  answeredCalls: number;
  unansweredCalls: number;
  totalMissedCalls: number;
}

type ClairePerformance = {
  queriesSolved: number;
  queriesForwarded: number;
  weeklyData: number[];
  totalHours: number;
  monthlyHours: number;
  currentMonth: string;
}

const Dashboard = () => {
  const { isAdmin, selectedBrandId, isAuthenticated, authLoading, currentMonth, user, brands } = useApp();
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | undefined>(undefined);
  const { setIsLoading } = useLoadingStore();

  // Disable global loader for this component and manage loading states
  useEffect(() => {
    // Disable global loader when dashboard loads
    setIsLoading(false);
    
    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, ensure global loader is off
        setIsLoading(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setIsLoading(false);
    };
  }, [setIsLoading]);

  // Helper function to convert month string to YYYY-MM format
  const convertMonthToParam = (monthString: string): string => {
    // monthString is like "January 2024"
    const [monthName, year] = monthString.split(' ');
    const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
    return `${year}-${monthNumber.toString().padStart(2, '0')}`;
  };

  // Build query params
  const getQueryParams = () => {
    const params = new URLSearchParams();
    if (selectedBrandId && selectedBrandId !== 'all') params.append('brandId', selectedBrandId);
    if (currentMonth) params.append('month', convertMonthToParam(currentMonth));
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Build query params for calls-only (adds week, excludes month)
  const getCallsQueryParams = () => {
    const params = new URLSearchParams();
    if (selectedBrandId && selectedBrandId !== 'all') params.append('brandId', selectedBrandId);
    if (selectedWeekStart) params.append('week', selectedWeekStart);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };
   
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<ApiResponse<DashboardStats>>({
    queryKey: ['dashboardStats', selectedBrandId, currentMonth],
    queryFn: () => apiClient.get(`/statistics/dashboard-stats${getQueryParams()}`),
    enabled: !authLoading && isAuthenticated,
  });

  // Fetch calls data
  const { data: callsData, isLoading: callsLoading, error: callsError } = useQuery<ApiResponse<CallsData>>({
    queryKey: ['callsData', selectedBrandId, selectedWeekStart], 
    queryFn: () => apiClient.get(`/statistics/calls-data${getCallsQueryParams()}`),
    enabled: !authLoading && isAuthenticated,
  });

  // Fetch missed calls data
  const { data: missedCallsData, isLoading: missedCallsLoading, error: missedCallsError } = useQuery<ApiResponse<MissedCallsData>>({
    queryKey: ['missedCallsData', selectedBrandId, currentMonth],
    queryFn: () => apiClient.get(`/statistics/missed-calls-data${getQueryParams()}`),
    enabled: !authLoading && isAuthenticated,
  });

  // Fetch Claire performance data
  const { data: clairePerformance, isLoading: claireLoading, error: claireError } = useQuery<ApiResponse<ClairePerformance>>({
    queryKey: ['clairePerformance', selectedBrandId, currentMonth],
    queryFn: () => apiClient.get(`/statistics/claire-performance${getQueryParams()}`),
    enabled: !authLoading && isAuthenticated,
  });

  // Fetch complaints data for escalated calls count
  const { data: complaintsData, isLoading: complaintsLoading, error: complaintsError } = useQuery<ComplaintsResponse>({
    queryKey: ['complaintsCount', selectedBrandId, currentMonth],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedBrandId && selectedBrandId !== 'all') params.append('brandName', selectedBrandId);
      if (currentMonth) params.append('month', convertMonthToParam(currentMonth));
      params.append('pageSize', '1'); // We only need the count from pagination
      return complaintsApi.getComplaints(Object.fromEntries(params));
    },
    enabled: !authLoading && isAuthenticated,
  });

  // Monitor API loading states and keep global loader disabled
  useEffect(() => {
    const anyLoading = statsLoading || callsLoading || missedCallsLoading || claireLoading || complaintsLoading;
    if (!anyLoading) {
      setIsLoading(false);
    }
  }, [statsLoading, callsLoading, missedCallsLoading, claireLoading, complaintsLoading, setIsLoading]);

  // Reset week selection when month changes
  useEffect(() => {
    setSelectedWeekStart(undefined);
  }, [currentMonth]);

  const error = statsError || callsError || missedCallsError || claireError || complaintsError;

  // Show main loading state only during auth loading
  if (authLoading) {
    return (
      <div className="content-area flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="content-area flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-area flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error Loading Dashboard</h2>
          <p className="text-gray-600 mt-2">{error instanceof Error ? error.message : 'Failed to load dashboard data'}</p>
        </div>
      </div>
    );
  }

  if (isAdmin()) {
    return (
      <>
        <GlobalHeader />
        <div className="content-area px-4 md:px-6 lg:px-8 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-textColor">Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <MonthFilter />
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <BrandFilter />
            </div>
          </div>
          </div>
        </div>
        
        <AdminStatCards />
        
        {selectedBrandId && (
          <div className="mb-6">
            <BrandInfoCard isAdmin={isAdmin()} />
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
          <div className="space-y-4 md:space-y-6">
            <WeeklyCallsCard className="w-full min-w-0" />
            <EscalatedCallsCard
              resolvedCalls={Math.floor((complaintsData?.pagination?.total || 0) * 0.65)}
              unresolvedCalls={Math.ceil((complaintsData?.pagination?.total || 0) * 0.35)}
              totalEscalatedCalls={complaintsData?.pagination?.total || 0}
              className="w-full min-w-0"
            />
          </div>
          
          <DashboardCard title="All Calls" className="w-full min-w-0 h-fit">
            {claireLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : claireError ? (
              <div className="h-[400px] flex items-center justify-center bg-red-50 rounded">
                <p className="text-red-500 text-center">Failed to load Claire performance data</p>
              </div>
            ) : (
              <ClaireChart
                queriesSolved={clairePerformance?.data?.queriesSolved ?? 29}
                queriesForwarded={clairePerformance?.data?.queriesForwarded ?? 4}
                weeklyData={clairePerformance?.data?.weeklyData ?? [5, 9, 3, 3]}
                totalHours={clairePerformance?.data?.totalHours ?? 140}
                monthlyHours={clairePerformance?.data?.monthlyHours ?? 120}
                currentMonth={clairePerformance?.data?.currentMonth || new Date().toLocaleString('default', { month: 'long' })}
              />
            )}
          </DashboardCard>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <GlobalHeader />
      <div className="content-area px-4 md:px-6 lg:px-8 max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-textColor">
                  Welcome Back,{' '}
                  <span className="">
                    {(
                      Array.isArray(user?.brand)
                        ? (brands?.[0]?.brandName)
                        : (user?.brand as any)?.brandName
                    ) || user?.name || 'User'}
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Here overview of your calls 
                </p>
              </div>
              <MonthFilter />
            </div>
          </div>
        </div>
      </div>
      
      <StatCards 
        stats={stats?.data || null}
        escalatedCalls={complaintsData?.pagination?.total || 0}
        solvedByClaire={clairePerformance?.data?.queriesSolved || 0}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        <div className="space-y-4 md:space-y-6">
          <WeeklyCallsCard className="w-full min-w-0" />
          <EscalatedCallsCard
            resolvedCalls={Math.floor((complaintsData?.pagination?.total || 0) * 0.65)}
            unresolvedCalls={Math.ceil((complaintsData?.pagination?.total || 0) * 0.35)}
            totalEscalatedCalls={complaintsData?.pagination?.total || 0}
            className="w-full min-w-0"
          />
        </div>
        
        <DashboardCard title="All Calls" className="w-full min-w-0 h-fit">
          {claireLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : claireError ? (
            <div className="h-[400px] flex items-center justify-center bg-red-50 rounded">
              <p className="text-red-500 text-center">Failed to load Claire performance data</p>
            </div>
          ) : (
            <ClaireChart
              queriesSolved={clairePerformance?.data?.queriesSolved ?? 29}
              queriesForwarded={clairePerformance?.data?.queriesForwarded ?? 4}
              weeklyData={clairePerformance?.data?.weeklyData ?? [5, 9, 3, 3]}
              totalHours={clairePerformance?.data?.totalHours ?? 140}
              monthlyHours={clairePerformance?.data?.monthlyHours ?? 120}
              currentMonth={clairePerformance?.data?.currentMonth || new Date().toLocaleString('default', { month: 'long' })}
            />
          )}
        </DashboardCard>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
