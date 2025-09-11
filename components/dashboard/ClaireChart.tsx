"use client"

import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ClaireChartProps {
  queriesSolved: number;
  queriesForwarded: number;
  weeklyData: number[];
  totalHours: number;
  monthlyHours: number;
  currentMonth: string;
}

const ClaireChart: React.FC<ClaireChartProps> = ({
  queriesSolved,
  queriesForwarded,
  weeklyData,
  totalHours,
  monthlyHours,
  currentMonth,
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Claims');
  
  const departments = ['Claims', 'Sales', 'Privacy', 'General'];
  
  // Calculate total calls handled by Claire
  const totalCallsHandledByClaire = queriesSolved;
  const otherCalls = queriesForwarded;
  const totalCalls = totalCallsHandledByClaire + otherCalls;

  // Donut chart data
  const donutData = {
    labels: ['Claire', 'Others'],
    datasets: [
      {
        data: [totalCallsHandledByClaire, otherCalls],
        backgroundColor: ['#9653DB', '#6B7280'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#9653DB',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
  };

  return (
    <Card className={cn("p-4 sm:p-5 border-none bg-transparent w-full max-w-full overflow-hidden")}>
      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Donut Chart Section */}
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 mx-auto">
            <Doughnut data={donutData} options={donutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-white">{totalCallsHandledByClaire}</div>
              <div className="text-gray-400 text-sm">Calls handled by Claire</div>
              <div className="text-gray-400 text-xs mt-1">Last Updated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
            </div>
          </div>
        </div>
        
        {/* Total Forwarded Calls */}
        <div className="flex justify-between items-center py-4 px-6 bg-gray-800 rounded-lg">
          <span className="text-gray-300">Total Forwarded Calls</span>
          <div className="flex items-center gap-3">
            <span className="text-white text-lg font-semibold">{otherCalls}</span>
            <button className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Show all
            </button>
          </div>
        </div>
        
        {/* Department Filter */}
        <div className="space-y-3">
          <h4 className="text-gray-300 font-medium">Filter Graph results by Department</h4>
          <div className="flex flex-wrap gap-3">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDepartment === dept
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClaireChart;