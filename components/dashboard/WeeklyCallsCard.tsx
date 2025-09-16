"use client"
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import WeekFilter from '@/components/dashboard/WeekFilter';
import { useApp } from '@/context/GlobalContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// API response types
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
}

type CallsData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

type DashboardStats = {
  totalCalls: number;
  missedCalls: number;
  averageHandlingTime: number;
  satisfactionRate: number;
}

interface WeeklyCallsCardProps {
  className?: string;
}

const WeeklyCallsCard: React.FC<WeeklyCallsCardProps> = ({ className }) => {
  const { selectedBrandId, isAuthenticated, authLoading, currentMonth } = useApp();
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | undefined>(undefined);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Helper function to convert month string to YYYY-MM format
  const convertMonthToParam = (monthString: string): string => {
    const [monthName, year] = monthString.split(' ');
    const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
    return `${year}-${monthNumber.toString().padStart(2, '0')}`;
  };

  // Build query params for calls (adds week, excludes month)
  const getCallsQueryParams = () => {
    const params = new URLSearchParams();
    if (selectedBrandId && selectedBrandId !== 'all') params.append('brandId', selectedBrandId);
    if (selectedWeekStart) params.append('week', selectedWeekStart);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  // Build query params for stats
  const getStatsQueryParams = () => {
    const params = new URLSearchParams();
    if (selectedBrandId && selectedBrandId !== 'all') params.append('brandId', selectedBrandId);
    if (currentMonth) params.append('month', convertMonthToParam(currentMonth));
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Fetch calls data
  const { data: callsData, isLoading: callsLoading, error: callsError } = useQuery<ApiResponse<CallsData>>({
    queryKey: ['callsData', selectedBrandId, selectedWeekStart], 
    queryFn: () => apiClient.get(`/statistics/calls-data${getCallsQueryParams()}`),
    enabled: !authLoading && isAuthenticated,
  });

  // Fetch dashboard stats for total calls
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<ApiResponse<DashboardStats>>({
    queryKey: ['dashboardStats', selectedBrandId, currentMonth],
    queryFn: () => apiClient.get(`/statistics/dashboard-stats${getStatsQueryParams()}`),
    enabled: !authLoading && isAuthenticated,
  });

  // Reset week selection when month changes
  useEffect(() => {
    setSelectedWeekStart(undefined);
  }, [currentMonth]);

  // Calculate total calls from the current week data
  const calculateWeeklyTotal = (data: CallsData | null): number => {
    if (!data || !data.datasets || data.datasets.length === 0) return 0;
    return data.datasets[0].data.reduce((sum, value) => sum + value, 0);
  };

  const weeklyTotal = callsData?.data ? calculateWeeklyTotal(callsData.data) : 0;

  // Chart configuration with custom hover effects
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        setHoveredBarIndex(elements[0].index);
      } else {
        setHoveredBarIndex(null);
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#9653DB',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: TooltipItem<'bar'>[]) => {
            return `Day ${tooltipItems[0].label}`;
          },
          label: (tooltipItem: TooltipItem<'bar'>) => {
            return `Calls: ${tooltipItem.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  // Prepare chart data with dynamic colors based on hover state
  const chartData = callsData?.data ? {
    labels: ['1', '2', '3', '4', '5', '6', '7'], // Replace date labels with day numbers
    datasets: callsData.data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.data.map((_, index) =>
        hoveredBarIndex === index ? '#9653DB' : '#E7D0FF47'
      ),
      borderWidth: 0,
      borderRadius: { topLeft: 12, topRight: 12, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false,
      barThickness: 24,
      maxBarThickness: 24,
    })),
  } : null;

  const isLoading = callsLoading || statsLoading;
  const error = callsError || statsError;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className={cn("p-5 component-shadow rounded-[18px] bg-white dark:bg-[#FFFFFF33] border-[#00000017] dark:border-[#FFFFFF1A] w-full max-w-full overflow-hidden h-[328px]", className)}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold truncate">
          Weekly Calls : {weeklyTotal}
        </h3>
        <WeekFilter value={selectedWeekStart} onChange={setSelectedWeekStart} />
      </div>

      {isLoading ? (
        <div className="h-[180px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="h-[180px] flex items-center justify-center bg-red-50 rounded">
          <p className="text-red-500 text-center">Failed to load calls data</p>
        </div>
      ) : (
        <div className=" flex-1 flex flex-col">
          {chartData ? (
            <div className="flex-1 flex flex-col w-full">
              <div className="flex-1 min-h-[220px]">
                <Bar options={options} data={chartData} />
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>X axis is Days (1-7)</span>
                <span>Y axis is Calls</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default WeeklyCallsCard;
