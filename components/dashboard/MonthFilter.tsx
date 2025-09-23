import React from 'react';
import { useApp } from '@/context/GlobalContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MonthFilter = () => {
  const { currentMonth, setCurrentMonth } = useApp();
  
  // Generate months dynamically based on current year
  const generateMonths = (): string[] => {
    const currentYear = new Date().getFullYear();
    const months: string[] = [];
    
    // Include previous year, current year, and next year
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      monthNames.forEach(month => {
        months.push(`${month} ${year}`);
      });
    }
    
    return months;
  };

  const months = generateMonths();

  return (
    <Select 
      value={currentMonth} 
      onValueChange={(value) => setCurrentMonth(value)}
    >
      <SelectTrigger isShowIconBlack className="w-full sm:w-40 bg-white text-black">
        <SelectValue placeholder="Month" />
      </SelectTrigger>
      <SelectContent className='bg-white text-black'>
        {months.map((month) => (
          <SelectItem key={month} value={month}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MonthFilter; 