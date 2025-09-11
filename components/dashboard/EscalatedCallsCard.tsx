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
      
      <div className="space-y-2 flex-1">
        {/* Resolved and Unresolved Labels with Icons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center justify-center gap-1">
              <Image 
                src="/resolved-call.svg" 
                alt="Resolved Call" 
                width={30} 
                height={30}
              />
            <span className="text-[#46D5B2] font-medium text-xs">Resolved call</span>
          </div>
          
          <div className="flex items-center justify-center gap-1">
            <span className="text-[#F47676] font-medium text-xs">Unresolved</span>
              <Image 
                src="/unresolved-call.svg" 
                alt="Unresolved Call" 
                width={30} 
                height={30}
              />
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full h-3 bg-gray-600 rounded-full overflow-hidden">
            <div className="flex h-full">
              {/* Resolved portion (green) */}
              <div 
                className="bg-[#46D5B2] h-full transition-all duration-500 ease-in-out"
                style={{ width: `${resolvedPercentage}%` }}
              />
              {/* Unresolved portion (red) */}
              <div 
                className="bg-[#F47676] h-full transition-all duration-500 ease-in-out"
                style={{ width: `${unresolvedPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EscalatedCallsCard;
