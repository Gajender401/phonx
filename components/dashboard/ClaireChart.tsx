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
        backgroundColor: ['#9653DB', '#D9D9D9'],
        borderColor: ['#9653DB', '#D9D9D9'],
        borderWidth: 1,
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
        
        {/* Donut Chart Section */}
        <div className="flex flex-col items-center">
          <div className="relative w-[156px] h-[156px] mx-auto">
            <Doughnut data={donutData} options={donutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-white">{totalCallsHandledByClaire}</div>
            </div>
          </div>
          <div className="text-[#B8B8B8] text-sm mt-3 font-semibold">Calls handled by Claire</div>
          <div className="text-gray-400 text-xs mt-1">Last Updated on 11 Sept</div>
        </div>
        
        {/* Total Forwarded Calls and Show all button side by side */}
        <div className="flex mb-9 mt-6 items-center gap-3">
          <div className="flex justify-between items-center px-6 rounded-lg flex-1" style={{ backgroundColor: '#C7B6DD14', height: '38px' }}>
            <span className="text-gray-300">Total Forwarded Calls</span>
            <span className="text-white text-lg font-semibold">{otherCalls}</span>
          </div>
          <button className="px-4 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors" style={{ height: '38px' }}>
            Show all
          </button>
        </div>
        
        {/* Department Filter */}
        <div className="space-y-3">
          <h4 className="text-gray-300 font-medium">Filter Graph results by Department</h4>
          <div className="grid grid-cols-4 gap-3">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 rounded-lg border-[#E4CAFF3D] border transition-colors ${
                  selectedDepartment === dept
                    ? 'text-white'
                    : 'text-gray-300 hover:opacity-80'
                }`}
                style={{ 
                  backgroundColor: selectedDepartment === dept ? '#C7B6DD14' : '#C7B6DD14',
                  height: '38px'
                }}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
    </Card>
  );
};

export default ClaireChart;