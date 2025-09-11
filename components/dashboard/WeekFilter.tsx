import React, { useMemo } from 'react';
import { useApp } from '@/context/GlobalContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeekOption {
  label: string;
  value: string; // ISO YYYY-MM-DD for week start
}

interface WeekFilterProps {
  value?: string;
  onChange: (value: string) => void;
}

const pad = (n: number) => n.toString().padStart(2, '0');

const formatIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
};

const formatRangeLabel = (start: Date, end: Date) => {
  const startMonth = start.toLocaleString('default', { month: 'long' });
  const endMonth = end.toLocaleString('default', { month: 'long' });
  const startLabel = `${startMonth} ${pad(start.getDate())}`;
  const endLabel = `${start.getMonth() === end.getMonth() ? '' : endMonth + ' '}${pad(end.getDate())}`;
  return `${startLabel} - ${endLabel}`;
};

const WeekFilter: React.FC<WeekFilterProps> = ({ value, onChange }) => {
  const { currentMonth } = useApp();

  const weekOptions: WeekOption[] = useMemo(() => {
    // currentMonth is like "April 2024"
    const [monthName, yearStr] = currentMonth.split(' ');
    const year = parseInt(yearStr, 10);
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();

    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    const options: WeekOption[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First week: from the 1st until the coming Saturday (clip to month end)
    const firstWeekStart = new Date(monthStart);
    const firstWeekEnd = new Date(monthStart);
    const daysUntilSaturday = 6 - monthStart.getDay(); // getDay: 0=Sun..6=Sat
    firstWeekEnd.setDate(firstWeekEnd.getDate() + Math.max(daysUntilSaturday, 0));
    if (firstWeekEnd > monthEnd) firstWeekEnd.setTime(monthEnd.getTime());
    if (firstWeekStart <= today) {
      options.push({
        label: formatRangeLabel(firstWeekStart, firstWeekEnd),
        value: formatIsoDate(firstWeekStart),
      });
    }

    // Subsequent weeks: Sunday-Saturday blocks
    let start = new Date(firstWeekEnd);
    start.setDate(start.getDate() + 1);
    while (start <= monthEnd) {
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      if (end > monthEnd) end.setTime(monthEnd.getTime());
      if (start <= today) {
        options.push({
          label: formatRangeLabel(start, end),
          value: formatIsoDate(start),
        });
      }
      start = new Date(end);
      start.setDate(start.getDate() + 1);
    }

    // Show latest week first
    return options.reverse();
  }, [currentMonth]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-44 bg-white text-black">
        <SelectValue placeholder="Select week" />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {weekOptions.map((week) => (
          <SelectItem key={week.value} value={week.value} className="text-black">
            {week.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default WeekFilter;


