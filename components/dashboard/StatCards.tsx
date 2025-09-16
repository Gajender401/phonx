'use client';
import React from 'react';
import { DashboardStats } from '@/lib/api-index';
import Image from 'next/image';

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
      iconSrc: "/total-calls.svg"
    },
    {
      title: "Escalated Calls",
      value: escalatedCalls,
      iconSrc: "/escalated-calls.svg"
    },
    {
      title: "Solved by Claire",
      value: solvedByClaire,
      iconSrc: "/solved-by-claire.svg"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-9">
      {cardData.map((card, index) => {
        return (
          <div
            key={index}
            className="bg-white dark:bg-[#FFFFFF33] border h-[111px] border-[#E4E7EC] dark:border-[#FFFFFF1A] px-6 py-3 rounded-[14px] min-w-0"
          >
            <div className="flex items-center justify-between">
              <Image
                src={card.iconSrc}
                alt={card.title}
                width={100}
                height={100}
                className=" flex-shrink-0"
              />
              <div className="min-w-0 flex-1 ml-6">
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