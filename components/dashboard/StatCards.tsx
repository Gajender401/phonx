'use client';
import React from 'react';
import { DashboardStats } from '@/lib/api-index';
import { Phone, PhoneCall, Bot } from 'lucide-react';

interface StatCardsProps {
  stats: DashboardStats | null;
  escalatedCalls?: number;
  solvedByClaire?: number;
}

const StatCards: React.FC<StatCardsProps> = ({ stats, escalatedCalls = 0, solvedByClaire = 0 }) => {
  if (!stats) return null;

  const cardData = [
    {
      title: "Total Calls",
      value: stats.totalCalls,
      icon: Phone,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      title: "Escalated Calls",
      value: escalatedCalls,
      icon: PhoneCall,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Solved by Claire",
      value: solvedByClaire,
      icon: Bot,
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {cardData.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-[#FFFFFF33] border border-[#E4E7EC] dark:border-[#FFFFFF1A] p-4 sm:p-6 rounded-[14px] min-w-0"
          >
            <div className="flex items-center justify-between">
              <div className={`${card.bgColor} p-2 rounded-full flex-shrink-0`}>
                <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1 ml-8">
                <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">{card.title}</h3>
                <p className="mt-2 text-2xl sm:text-3xl font-semibold text-foreground dark:text-white">{card.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards; 