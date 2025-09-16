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
    <div>
      <GlobalHeader title="Escalated Calls" />
      <div className="content-area h-screen flex flex-col overflow-hidden">
        <div className="flex-none">

          {/* Status Text and Filters in same line */}
          <div className=" px-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Status Text on the left */}
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                All {activeTab === 'answered' ? 'Resolved' : 'Unanswered'} Calls - {total}
              </div>

              {/* Search and Selects on the right */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by Phone no."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10  w-48"
                  />
                </div>

                <Select
                  value={currentMonth}
                  onValueChange={(value) => {
                    setCurrentMonth(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-40 ">
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
          </div>

          {/* Tabs */}
          <div className="px-4 mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8">
                <button
                  onClick={() => { setActiveTab('answered'); setPage(1); }}
                  className={`py-2 px-1 border-b-2 font-semibold text-xl ${activeTab === 'answered'
                    ? 'border-black text-black dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-[#9D9494] dark:hover:text-gray-200 dark:hover:border-gray-600'
                    }`}
                >
                  Resolved Calls
                </button>
                <button
                  onClick={() => { setActiveTab('unanswered'); setPage(1); }}
                  className={`py-2 px-1 border-b-2 font-semibold text-xl ${activeTab === 'unanswered'
                    ? 'border-black text-black dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-[#9D9494] dark:hover:text-gray-200 dark:hover:border-gray-600'
                    }`}
                >
                  Unresolved Calls
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div
          ref={scrollElementRef as React.RefObject<HTMLDivElement>}
          className="flex-1 overflow-y-auto px-4 pb-4"
        >
          <div className="grid grid-cols-1 gap-5">
            {isLoading ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="mt-2 text-gray-500">Loading {activeTab} calls...</p>
              </div>
            ) : missedCalls.length > 0 ? (
              missedCalls.map((call) => (
                <Card
                  key={call.id}
                  className="relative p-5 component-shadow card-radius bg-white dark:bg-[#0000004D] hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(call.id)}
                >
                  {activeTab === 'unanswered' && (
                    <Button
                      className="absolute top-4 rounded-[10px] right-4 border-0 bg-[#8ECD90] text-white hover:bg-[#8ECD90]/80 dark:border-2 dark:border-[#46D5B275] dark:bg-[#46D5B221] dark:hover:bg-[#46D5B221]/80 dark:text-white"
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
                      <span className="font-semibold text-black dark:text-white text-xl">
                        Customer Number- {call.phoneNumber}
                      </span>
                      <span className="px-3 py-1 text-sm rounded-full text-black dark:text-white bg-[#9653DB1A] dark:bg-[#9653DB33]">
                        {call.department}
                      </span>
                    </div>

                    {/* Other information */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-4 py-2 text-xs rounded-full border border-[#E1E1E1] bg-white dark:bg-[#FFFFFF0D] dark:border-0 text-[#767680] dark:text-white">
                          Call {call.id}
                        </span>
                        <span className="text-[#767680] dark:text-white">|</span>
                        <span className="px-4 py-2 text-xs rounded-full border border-[#E1E1E1] bg-white dark:bg-[#FFFFFF0D] dark:border-0 text-[#767680] dark:text-white">
                          {call.time} - {call.date}
                        </span>
                        <span className="text-[#767680] dark:text-white">|</span>
                        <span className="px-4 py-2 text-xs rounded-full border border-[#E1E1E1] bg-white dark:bg-[#FFFFFF0D] dark:border-0 text-[#767680] dark:text-white">
                          Duration : 4
                        </span>
                      </div>

                      <div className="border border-[#FFFFFF1A] p-3 rounded-[10px]">
                        <h3 className="font-extrabold text-[#696A6F] dark:text-white text-lg mb-2">Call Description</h3>
                        <div className="text-[#696A6F] dark:text-white font-sans text-sm">
                          {(() => {
                            const words = call.inquiry.split(' ');
                            const firstLineWords = 3; // First line shows 3 words
                            const secondLineWords = 3; // Second line shows 3 words before "Show more"
                            const isExpanded = expandedDescriptions.has(call.id);

                            if (words.length <= firstLineWords + secondLineWords || isExpanded) {
                              // If total words are less than or equal to 6, or if expanded, show all
                              return (
                                <div>
                                  <p className="mb-1">{call.inquiry}</p>
                                  {words.length > firstLineWords + secondLineWords && (
                                    <span
                                      className="font-medium cursor-pointer hover:opacity-80 transition-opacity underline"
                                      style={{
                                        color: resolvedTheme === 'dark' ? 'white' : '#D5ADFF'
                                      }}
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
                                    className="font-medium cursor-pointer hover:opacity-80 transition-opacity underline"
                                    style={{
                                      color: resolvedTheme === 'dark' ? 'white' : '#D5ADFF'
                                    }}
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

          {/* Pagination at the bottom */}
          {missedCalls.length > 0 && (
            <div className="flex items-center justify-center gap-1 mt-6 mb-4">
              {/* Previous Button */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full ${resolvedTheme === 'dark'
                    ? 'bg-white border-0 hover:bg-white/80'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 text-black" />
              </Button>

              {/* Page Numbers */}
              {(() => {
                const pages = [];
                const showPages = 5; // Number of pages to show around current page
                const halfShow = Math.floor(showPages / 2);

                let startPage = Math.max(1, currentPage - halfShow);
                let endPage = Math.min(totalPages, currentPage + halfShow);

                // Adjust if we're near the beginning or end
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
                      className={`h-9 w-9 rounded-[10px] text-sm ${currentPage === 1
                          ? resolvedTheme === 'dark'
                            ? 'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
                            : 'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
                          : resolvedTheme === 'dark'
                            ? 'bg-white text-black hover:bg-white/80'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-black'
                        }`}
                      onClick={() => setPage(1)}
                    >
                      1
                    </Button>
                  );

                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" className="px-2 text-gray-500">
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
                      className={`h-9 w-9 rounded-[10px] text-sm ${currentPage === i
                          ? resolvedTheme === 'dark'
                            ?'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
                            :'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
                          : resolvedTheme === 'dark'
                            ? 'bg-white text-black hover:bg-white/80'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-black'
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
                      <span key="ellipsis2" className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }

                  pages.push(
                    <Button
                      key={totalPages}
                      variant="ghost"
                      size="sm"
                      className={`h-9 w-9 rounded-[10px] text-sm ${currentPage === totalPages
                          ? resolvedTheme === 'dark'
                            ?'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
                            :'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
                          : resolvedTheme === 'dark'
                            ? 'bg-white text-black hover:bg-white/80'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-black'
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
                className={`h-9 w-9 rounded-full ${resolvedTheme === 'dark'
                    ? 'bg-white border-0 hover:bg-white/80'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4 text-black" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissedCalls;