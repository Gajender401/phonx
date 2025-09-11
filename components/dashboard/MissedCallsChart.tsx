import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface MissedCallsChartProps {
  answeredCalls: number;
  unansweredCalls: number;
  totalMissedCalls: number;
}

const MissedCallsChart: React.FC<MissedCallsChartProps> = ({ 
  answeredCalls, 
  unansweredCalls, 
  totalMissedCalls 
}) => {
  // Calculate percentages for the progress bar
  const answeredPercentage = totalMissedCalls > 0 ? (answeredCalls / totalMissedCalls) * 100 : 0;
  const unansweredPercentage = totalMissedCalls > 0 ? (unansweredCalls / totalMissedCalls) * 100 : 0;

  return (
    <div className="space-y-6 w-full overflow-hidden">
      {/* Answered and Unanswered Labels with Icons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <span className="text-green-400 font-medium">Resolved call</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-red-400 font-medium">Unresolved</span>
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-4 bg-gray-600 rounded-full overflow-hidden">
          <div className="flex h-full">
            {/* Answered portion (green) */}
            <div 
              className="bg-green-500 h-full transition-all duration-500 ease-in-out"
              style={{ width: `${answeredPercentage}%` }}
            />
            {/* Unanswered portion (red) */}
            <div 
              className="bg-red-500 h-full transition-all duration-500 ease-in-out"
              style={{ width: `${unansweredPercentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="flex justify-between items-center text-sm text-gray-300">
        <span>{answeredCalls} resolved ({answeredPercentage.toFixed(0)}%)</span>
        <span>{unansweredCalls} unresolved ({unansweredPercentage.toFixed(0)}%)</span>
      </div>
    </div>
  );
};

export default MissedCallsChart;
