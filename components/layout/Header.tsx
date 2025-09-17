import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/GlobalContext';
import { useAudio } from '@/context/AudioContext';
import { useTheme } from '@/context/ThemeContext';
import AudioPlayer from '@/components/AudioPlayer';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showMonthFilter?: boolean;
  showDepartmentFilter?: boolean;
  showBrandFilterIntegrated?: boolean;
  onMonthChange?: (month: string) => void;
  onDepartmentChange?: (department: string) => void;
  onBrandChange?: (brand: string) => void;
  filtersPosition?: 'right' | 'below';
  rightContent?: React.ReactNode;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showMonthFilter = false,
  showDepartmentFilter = false,
  showBrandFilterIntegrated = false,
  onMonthChange,
  onDepartmentChange,
  onBrandChange,
  filtersPosition = 'right',
  rightContent,
  onBackClick
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { currentMonth, setCurrentMonth, selectedDepartment, setSelectedDepartment, brands, selectedBrandId, setSelectedBrand, setSelectedBrandId } = useApp();
  const { currentAudio, isPlaying, scrollToCard } = useAudio();

  const { departments, departmentsLoading } = useApp();

  console.log('departments', departments);
  
  const months = [
    'January 2025',
    'February 2025',
    'March 2025',
    'April 2025',
    'May 2025',
    'June 2025',
    'July 2025',
    'August 2025',
    'September 2025',
    'October 2025',
    'November 2025',
    'December 2025'
  ];

  const handleMonthChange = (value: string) => {
    setCurrentMonth(value);
    onMonthChange?.(value);
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    onDepartmentChange?.(value);
  };

  const handleBrandChange = (value: string) => {
    if (value === 'all') {
      setSelectedBrandId('all');
      setSelectedBrand(null);
      onBrandChange?.('');
      return;
    }
    const brand = brands.find(b => b.id === value);
    setSelectedBrandId(value);
    setSelectedBrand(brand || null);
    onBrandChange?.(brand?.brandName || '');
  };

  const filtersFragment = (
    <>
      {showDepartmentFilter && (
        <Select 
          value={selectedDepartment} 
          onValueChange={handleDepartmentChange}
          disabled={departmentsLoading}
        >
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className='bg-background'>
            <SelectItem value="all">All Departments</SelectItem>
            {departments?.map((department) => (
              <SelectItem key={department.id} value={department.id.toString()}>
                {department.departmentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showBrandFilterIntegrated && (
        <Select
          value={selectedBrandId || 'all'}
          onValueChange={handleBrandChange}
        >
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent className='bg-background'>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.brandName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showMonthFilter && (
        <Select 
          value={currentMonth} 
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className='bg-background'>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );

  return (
    <div className="flex flex-col pb-4 gap-4">
      {/* {currentAudio && pathname.endsWith('history') && (
        <Card
          className="p-3 bg-card component-shadow cursor-pointer hover:bg-accent transition-colors"
          onClick={scrollToCard}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">#{currentAudio.callNumber}</span>
                <span className="text-sm text-muted-foreground line-clamp-1">{currentAudio.transcript}</span>
                <ArrowUp size={14} className="text-muted-foreground ml-1" />
              </div>
            </div>
            <div className="w-64" onClick={(e) => e.stopPropagation()}>
              <AudioPlayer 
                src={currentAudio.src} 
                isHeaderPlayer={true}
              />
            </div>
          </div>
        </Card>
      )} */}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackClick || (() => router.back())}
              className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: resolvedTheme === 'light' ? '#FFFFFF' : '#FFFFFF33',
                border: resolvedTheme === 'light' ? '1px solid #000000' : 'none',
              }}
            >
              <ArrowLeft
                size={20}
                color={resolvedTheme === 'light' ? '#000000' : '#FFFFFF'}
              />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-textColor">{title}</h1>
            <p className="text-muted-foreground mt-1">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            {filtersPosition === 'below' && (
              <div className="flex flex-wrap gap-3 mt-3">
                {filtersFragment}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {filtersPosition === 'right' && (
            <div className="flex flex-col sm:flex-row gap-3">
              {filtersFragment}
            </div>
          )}
          {rightContent}
        </div>
      </div>
    </div>
  );
};

export default Header;
