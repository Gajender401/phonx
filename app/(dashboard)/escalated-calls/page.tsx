'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card } from '@/components/ui/card';
import { Phone, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { missedCallsApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { useApp } from '@/context/GlobalContext';
import { useTheme } from '@/context/ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useScrollRestoration, useListState } from '@/hooks/use-scroll-restoration';

const MissedCalls = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const { currentMonth, selectedDepartment, isAuthenticated, authLoading, departments, setCurrentMonth, setSelectedDepartment } = useApp();

  // Use scroll restoration for the main container
  const { scrollElementRef, navigateWithScrollSave } = useScrollRestoration('escalated-calls-page');

  // Use persistent state for tab and pagination
  const [activeTab, setActiveTab, clearTabState] = useListState<'unanswered' | 'answered'>('escalated-calls-tab', 'unanswered');
  const [page, setPage, clearPageState] = useListState('escalated-calls-page', 1);
  const pageSize = 20;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());

  // Build filters for the query
  const getFilters = () => {
    const filters: { status: 'unanswered' | 'answered'; month?: string; departmentId?: string; search?: string; page?: number; pageSize?: number } = {
      status: activeTab,
      page,
      pageSize
    };

    // Add month filter if selected
    if (currentMonth) {
      const [monthName, year] = currentMonth.split(' ');
      const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
      filters.month = `${year}-${monthNumber.toString().padStart(2, '0')}`;
    }

    // Add department filter if selected
    if (selectedDepartment && selectedDepartment !== 'all') {
      filters.departmentId = selectedDepartment;
    }

    // Add search filter if entered
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }

    return filters;
  };

  // Fetch missed calls using React Query
  const { data: missedCallsData, isLoading } = useQuery({
    queryKey: ['missedCalls', activeTab, currentMonth, selectedDepartment, searchQuery, page, pageSize],
    queryFn: () => missedCallsApi.getMissedCalls(getFilters()),
    enabled: !authLoading && isAuthenticated,
    placeholderData: (previousData, previousQuery) => previousData,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes for this specific query
  });

  // Mutation to mark call as resolved
  const markResolvedMutation = useMutation({
    mutationFn: (callId: number) => missedCallsApi.markAsAnswered(callId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missedCalls'] });
      toast({
        title: "Success",
        description: "Call marked as resolved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark call as resolved. Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleViewDetails = (id: number) => {
    navigateWithScrollSave(`/escalated-calls/${id}`);
  };

  const toggleDescription = (callId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(callId)) {
        newSet.delete(callId);
      } else {
        newSet.add(callId);
      }
      return newSet;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please log in to access escalated calls.</p>
        </div>
      </div>
    );
  }

  const missedCalls = missedCallsData?.success ? missedCallsData.data.calls : [];
  const total = missedCallsData?.success ? missedCallsData.data.pagination.total : 0;
  const currentPage = missedCallsData?.success ? missedCallsData.data.pagination.page : page;
  const limit = missedCallsData?.success ? missedCallsData.data.pagination.limit : pageSize;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

  return (
    <>
      <GlobalHeader />
      <div className="content-area px-4 md:px-6 lg:px-8 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-textColor">
                  Escalated Calls
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  All {activeTab === 'answered' ? 'Resolved' : 'Unanswered'} Calls - {total}
                </p>
              </div>
            </div>

            {/* Search and Selects */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by Phone no."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 w-48"
                />
              </div>

              <Select
                value={currentMonth}
                onValueChange={(value) => {
                  setCurrentMonth(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="January 2025">January 2025</SelectItem>
                  <SelectItem value="February 2025">February 2025</SelectItem>
                  <SelectItem value="March 2025">March 2025</SelectItem>
                  <SelectItem value="April 2025">April 2025</SelectItem>
                  <SelectItem value="May 2025">May 2025</SelectItem>
                  <SelectItem value="June 2025">June 2025</SelectItem>
                  <SelectItem value="July 2025">July 2025</SelectItem>
                  <SelectItem value="August 2025">August 2025</SelectItem>
                  <SelectItem value="September 2025">September 2025</SelectItem>
                  <SelectItem value="October 2025">October 2025</SelectItem>
                  <SelectItem value="November 2025">November 2025</SelectItem>
                  <SelectItem value="December 2025">December 2025</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedDepartment || 'all'}
                onValueChange={(value) => {
                  setSelectedDepartment(value === 'all' ? '' : value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              <button
                onClick={() => { setActiveTab('answered'); setPage(1); }}
                className={`py-2 px-1 border-b-2 font-semibold text-xl ${activeTab === 'answered'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                Resolved Calls
              </button>
              <button
                onClick={() => { setActiveTab('unanswered'); setPage(1); }}
                className={`py-2 px-1 border-b-2 font-semibold text-xl ${activeTab === 'unanswered'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
              >
                Unresolved Calls
              </button>
            </nav>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading {activeTab} calls...</p>
            </div>
          ) : missedCalls.length > 0 ? (
            missedCalls.map((call) => (
              <Card
                key={call.id}
                ref={scrollElementRef as React.RefObject<HTMLDivElement>}
                className="relative p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(call.id)}
              >
                {activeTab === 'unanswered' && (
                  <Button
                    className="absolute top-4 right-4 rounded-lg bg-green-600 text-white hover:bg-green-700"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markResolvedMutation.mutate(call.id);
                    }}
                    disabled={markResolvedMutation.isPending}
                  >
                    {markResolvedMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Mark As Resolved
                  </Button>
                )}
                <div className="flex flex-col gap-4">
                  {/* Customer number and department on same line */}
                  <div className="flex items-center justify-start gap-3">
                    <span className="font-semibold text-xl">
                      Customer Number- {call.phoneNumber}
                    </span>
                    <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                      {call.department}
                    </span>
                  </div>

                  {/* Call information */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                      Call {call.id}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                      {call.time} - {call.date}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                      Duration: 4 min
                    </span>
                  </div>

                  {/* Call Description */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h3 className="font-semibold text-lg mb-2">Call Description</h3>
                    <div className="text-sm">
                      {(() => {
                        const words = call.inquiry.split(' ');
                        const firstLineWords = 3;
                        const secondLineWords = 3;
                        const isExpanded = expandedDescriptions.has(call.id);

                        if (words.length <= firstLineWords + secondLineWords || isExpanded) {
                          return (
                            <div>
                              <p className="mb-1">{call.inquiry}</p>
                              {words.length > firstLineWords + secondLineWords && (
                                <span
                                  className="font-medium cursor-pointer hover:opacity-80 transition-opacity underline text-primary"
                                  onClick={(e) => toggleDescription(call.id, e)}
                                >
                                  {isExpanded ? 'Show less' : 'Show more'}
                                </span>
                              )}
                            </div>
                          );
                        }

                        const firstLine = words.slice(0, firstLineWords).join(' ');
                        const secondLine = words.slice(firstLineWords, firstLineWords + secondLineWords).join(' ');

                        return (
                          <div>
                            <p className="mb-1">{firstLine}</p>
                            <p className="mb-1">
                              {secondLine}{' '}
                              <span
                                className="font-medium cursor-pointer hover:opacity-80 transition-opacity underline text-primary"
                                onClick={(e) => toggleDescription(call.id, e)}
                              >
                                Show more
                              </span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <h3 className="text-xl font-medium mb-2">
                {activeTab === 'unanswered' ? 'No Unresolved Calls' : 'No Answered Calls'}
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'unanswered'
                  ? 'All escalated calls have been handled.'
                  : 'No answered calls found for the selected filters.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {missedCalls.length > 0 && (
          <div className="flex items-center justify-center gap-1 mt-8">
            {/* Previous Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            {(() => {
              const pages = [];
              const showPages = 5;
              const halfShow = Math.floor(showPages / 2);

              let startPage = Math.max(1, currentPage - halfShow);
              let endPage = Math.min(totalPages, currentPage + halfShow);

              if (currentPage <= halfShow) {
                endPage = Math.min(totalPages, showPages);
              }
              if (currentPage + halfShow >= totalPages) {
                startPage = Math.max(1, totalPages - showPages + 1);
              }

              // First page + ellipsis
              if (startPage > 1) {
                pages.push(
                  <Button
                    key={1}
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 rounded-lg text-sm ${currentPage === 1
                        ? 'bg-primary text-primary-foreground'
                        : ''
                      }`}
                    onClick={() => setPage(1)}
                  >
                    1
                  </Button>
                );

                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis1" className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }
              }

              // Main page numbers
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 rounded-lg text-sm ${currentPage === i
                        ? 'bg-primary text-primary-foreground'
                        : ''
                      }`}
                    onClick={() => setPage(i)}
                  >
                    {i}
                  </Button>
                );
              }

              // Last page + ellipsis
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }

                pages.push(
                  <Button
                    key={totalPages}
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 rounded-lg text-sm ${currentPage === totalPages
                        ? 'bg-primary text-primary-foreground'
                        : ''
                      }`}
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                );
              }

              return pages;
            })()}

            {/* Next Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default MissedCalls;