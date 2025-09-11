"use client"
import React from 'react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface EscalatedCallsCardProps {
  resolvedCalls: number;
  unresolvedCalls: number;
  totalEscalatedCalls: number;
  className?: string;
}

const EscalatedCallsCard: React.FC<EscalatedCallsCardProps> = ({
  resolvedCalls,
  unresolvedCalls,
  totalEscalatedCalls,
  className
}) => {
  // Calculate percentages for the progress bar
  const resolvedPercentage = totalEscalatedCalls > 0 ? (resolvedCalls / totalEscalatedCalls) * 100 : 0;
  const unresolvedPercentage = totalEscalatedCalls > 0 ? (unresolvedCalls / totalEscalatedCalls) * 100 : 0;

  return (
    <Card className={cn("p-4 sm:p-5 component-shadow card-radius bg-white dark:bg-[#FFFFFF33] border-[#00000017] dark:border-[#FFFFFF1A] w-full max-w-full overflow-hidden h-[140px] flex flex-col justify-between", className)}>
      <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">
        Escalated Calls : {totalEscalatedCalls}
      </h3>
      
      <div className="space-y-4 flex-1">
        {/* Resolved and Unresolved Labels with Icons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Image 
                src="/resolved-call.svg" 
                alt="Resolved Call" 
                width={20} 
                height={20}
                className="text-green-400"
              />
            </div>
            <span className="text-green-400 font-medium text-sm">Resolved call</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-red-400 font-medium text-sm">Unresolved</span>
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <Image 
                src="/unresolved-call.svg" 
                alt="Unresolved Call" 
                width={20} 
                height={20}
                className="text-red-400"
              />
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full h-3 bg-gray-600 rounded-full overflow-hidden">
            <div className="flex h-full">
              {/* Resolved portion (green) */}
              <div 
                className="bg-green-500 h-full transition-all duration-500 ease-in-out"
                style={{ width: `${resolvedPercentage}%` }}
              />
              {/* Unresolved portion (red) */}
              <div 
                className="bg-red-500 h-full transition-all duration-500 ease-in-out"
                style={{ width: `${unresolvedPercentage}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="flex justify-between items-center text-xs text-gray-300">
          <span>{resolvedCalls} resolved ({resolvedPercentage.toFixed(0)}%)</span>
          <span>{unresolvedCalls} unresolved ({unresolvedPercentage.toFixed(0)}%)</span>
        </div>
      </div>
    </Card>
  );
};

export default EscalatedCallsCard;
