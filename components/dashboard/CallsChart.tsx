import React from 'react';
import { Bar } from 'react-chartjs-2';
import { CallsData } from '@/lib/api-index';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
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

interface CallsChartProps {
  data: CallsData | null;
  totalCalls?: number;
  dateRange?: string;
}

const CallsChart: React.FC<CallsChartProps> = ({ data, totalCalls, dateRange }) => {
  if (!data) {
    return (
      <div className="space-y-4 w-full overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base md:text-lg font-semibold">Total calls this week: {totalCalls || 0}</h3>
            {dateRange && <p className="text-xs md:text-sm text-gray-500">{dateRange}</p>}
          </div>
        </div>
        <div className="h-[160px] md:h-[180px] lg:h-[200px] w-full flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: '#4CAF50',
      borderRadius: 6,
    })),
  };

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base md:text-lg font-semibold">Total calls this week: {totalCalls || 0}</h3>
          {dateRange && <p className="text-xs md:text-sm text-gray-500">{dateRange}</p>}
        </div>
      </div>
      <div className="h-[160px] md:h-[180px] lg:h-[200px] w-full">
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};

export default CallsChart;