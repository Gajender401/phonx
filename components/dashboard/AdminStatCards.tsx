'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, complaintsApi, type ComplaintsResponse } from '@/lib/api';
import { Phone, Building2, PhoneCall, Bot } from 'lucide-react';
import { useApp } from '@/context/GlobalContext';

type AdminStats = {
  totalCalls: number;
  totalBrands: number;
}

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
}

type ClairePerformance = {
  queriesSolved: number;
  queriesForwarded: number;
  weeklyData: number[];
  totalHours: number;
  monthlyHours: number;
  currentMonth: string;
}

const AdminStatCards = () => {
  const { isAuthenticated, authLoading } = useApp();
  
  const { data: stats, isLoading } = useQuery<ApiResponse<AdminStats>>({
    queryKey: ['adminStats'],
    queryFn: () => apiClient.get('/statistics/admin-stats'),
    enabled: !authLoading && isAuthenticated,
  });

  // Fetch complaints data for escalated calls count
  const { data: complaintsData, isLoading: complaintsLoading } = useQuery<ComplaintsResponse>({
    queryKey: ['adminComplaintsCount'],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('pageSize', '1'); // We only need the count from pagination
      return complaintsApi.getComplaints(Object.fromEntries(params));
    },
    enabled: !authLoading && isAuthenticated,
  });

  // Fetch Claire performance data
  const { data: clairePerformance, isLoading: claireLoading } = useQuery<ApiResponse<ClairePerformance>>({
    queryKey: ['adminClairePerformance'],
    queryFn: () => apiClient.get(`/statistics/claire-performance`),
    enabled: !authLoading && isAuthenticated,
  });

  if (isLoading || complaintsLoading || claireLoading || !stats?.data) return null;

  const cardData = [
    {
      title: "Total Calls",
      value: stats.data.totalCalls,
      icon: Phone,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      title: "Escalated Calls", 
      value: complaintsData?.pagination?.total || 0,
      icon: PhoneCall,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Total Brands",
      value: stats.data.totalBrands,
      icon: Building2,
      bgColor: "bg-purple-100", 
      iconColor: "text-purple-600"
    },
    {
      title: "Solved by Claire",
      value: clairePerformance?.data?.queriesSolved || 0,
      icon: Bot,
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cardData.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div 
            key={index}
            className="bg-white dark:bg-[#FFFFFF33] border border-[#E4E7EC] dark:border-[#FFFFFF1A] p-4 sm:p-6 rounded-lg min-w-0"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">{card.title}</h3>
                <p className="mt-2 text-2xl sm:text-3xl font-semibold text-foreground dark:text-white">{card.value.toLocaleString()}</p>
              </div>
              <div className={`${card.bgColor} p-2 rounded-full flex-shrink-0`}>
                <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStatCards; 