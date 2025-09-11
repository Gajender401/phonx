import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className }) => {
  return (
    <Card className={cn("p-4 sm:p-5 component-shadow card-radius bg-white dark:bg-[#FFFFFF33] border-[#00000017] dark:border-[#FFFFFF1A] w-full max-w-full overflow-hidden", className)}>
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 truncate">{title}</h3>
      <div className="w-full overflow-hidden">
        {children}
      </div>
    </Card>
  );
};

export default DashboardCard;
