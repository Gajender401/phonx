'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Phone, CheckCircle, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { missedCallsApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { useApp } from '@/context/GlobalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useScrollRestoration, useListState } from '@/hooks/use-scroll-restoration';

const MissedCalls = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentMonth, selectedDepartment, isAuthenticated, authLoading } = useApp();
  
  // Use scroll restoration for the main container
  const { scrollElementRef, navigateWithScrollSave } = useScrollRestoration('escalated-calls-page');
  
  // Use persistent state for tab and pagination
  const [activeTab, setActiveTab, clearTabState] = useListState<'unanswered' | 'answered'>('escalated-calls-tab', 'unanswered');
  const [page, setPage, clearPageState] = useListState('escalated-calls-page', 1);
  const pageSize = 20;

  // Build filters for the query
  const getFilters = () => {
    const filters: { status: 'unanswered' | 'answered'; month?: string; departmentId?: string; page?: number; pageSize?: number } = {
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

    return filters;
  };

  // Fetch missed calls using React Query
  const { data: missedCallsData, isLoading } = useQuery({
    queryKey: ['missedCalls', activeTab, currentMonth, selectedDepartment, page, pageSize],
    queryFn: () => missedCallsApi.getMissedCalls(getFilters()),
    enabled: !authLoading && isAuthenticated,
    placeholderData: (previousData, previousQuery) => previousData,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes for this specific query
  });

  // Mark as answered mutation
  const markAsAnsweredMutation = useMutation({
    mutationFn: (id: number) => missedCallsApi.markAsAnswered(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Call marked as answered",
      });
      // Invalidate and refetch missed calls
      queryClient.invalidateQueries({ queryKey: ['missedCalls'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark call as answered",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsAnswered = (id: number) => {
    markAsAnsweredMutation.mutate(id);
  };

  const handleViewDetails = (id: number) => {
    navigateWithScrollSave(`/escalated-calls/${id}`);
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
    <div className="content-area h-screen flex flex-col overflow-hidden">
      <div className="flex-none">
        <Header 
          title="Escalated Calls" 
          showMonthFilter={true} 
          showDepartmentFilter={true} 
          filtersPosition="below"
          onMonthChange={() => setPage(1)}
          onDepartmentChange={() => setPage(1)}
          rightContent={
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9" 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-gray-600">
                Page {currentPage} {totalPages ? `of ${totalPages}` : ''}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9" 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => { setActiveTab('unanswered'); setPage(1); }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'unanswered'
                    ? 'border-black text-black dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                }`}
              >
                Unanswered Calls
                {missedCallsData?.success && activeTab === 'unanswered' && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {missedCallsData.data.pagination.total}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('answered'); setPage(1); }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'answered'
                    ? 'border-black text-black dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                }`}
              >
                Resolved Calls
                {missedCallsData?.success && activeTab === 'answered' && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {missedCallsData.data.pagination.total}
                  </span>
                )}
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
              className="p-5 component-shadow card-radius bg-white dark:bg-[#0000004D] hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(call.id)}
            >
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span 
                      className="font-semibold text-[#0B6BAF] cursor-pointer hover:underline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(call.id);
                      }}
                    >
                      Call {call.id}
                    </span>
                    <span className="text-sm text-gray-500">{call.time} - {call.date}</span>
                    <span className="px-2 py-1 text-xs rounded-full text-white bg-[#0B6BAF]">
                      {call.department}
                    </span>
                    {/* Status badge */}
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${
                      call.status === 'answered' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {call.status === 'answered' ? 'Answered' : 'Unanswered'}
                    </span>
                    {/* Action buttons */}
                    <div className="ml-auto flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => handleViewDetails(call.id)}
                      >
                        <Eye size={14} className="mr-1.5" />
                        View Details
                      </Button>
                      {/* Show mark as answered button only for unanswered calls */}
                      {activeTab === 'unanswered' && (
                        <Button 
                          className="bg-green-500 hover:bg-green-600 text-white px-3 h-8 rounded-xl text-sm"
                          onClick={() => handleMarkAsAnswered(call.id)}
                          disabled={markAsAnsweredMutation.isPending}
                        >
                          {markAsAnsweredMutation.isPending ? (
                            <>
                              <Loader2 size={14} className="mr-1.5 animate-spin" />
                              Marking...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} className="mr-1.5" />
                              Mark as Answered
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center my-3 gap-2 text-sm text-gray-500">
                    <Phone size={16} />
                    <span>{call.phoneNumber}</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-[#404040] text-lg mb-2">Short Inquiry Description</h3>
                    <p className="text-gray-700 font-sans text-sm">{call.inquiry}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-10">
            <h3 className="text-xl font-medium mb-2">
              {activeTab === 'unanswered' ? 'No Unanswered Calls' : 'No Answered Calls'}
            </h3>
            <p className="text-muted-foreground">
              {activeTab === 'unanswered' 
                ? 'All escalated calls have been handled.' 
                : 'No answered calls found for the selected filters.'}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default MissedCalls;