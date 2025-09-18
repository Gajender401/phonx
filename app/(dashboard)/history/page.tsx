"use client"
import React, { useState } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card } from '@/components/ui/card';
import { Phone, Flag, Clock, ChevronLeft, ChevronRight, Bookmark, X, Calendar } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayerSmall';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { AxiosError } from 'axios';
import { useApp } from '@/context/GlobalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useScrollRestoration, useListState } from '@/hooks/use-scroll-restoration';
import Image from 'next/image';
import { IoEyeSharp } from "react-icons/io5";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface Call {
  id: number;
  time: string;
  date: string;
  handledBy: string;
  phoneNumber: string;
  callNumber: string;
  transcript: string;
  audioUrl: string;
  isFlagged: boolean;
  complaintInfo?: {
    complaintId: number;
    complaintStatus: string;
    flaggedAt: string;
  } | null;
}

interface CallsResponse {
  success: boolean;
  data: Call[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Custom Flag Popup Component
const FlagPopup = ({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) => {
  const [message, setMessage] = useState('');
  const maxLength = 500;

  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message.trim());
      setMessage('');
      onClose();
    }
  };

  const handleCancel = () => {
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E1F22] rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-black dark:text-white text-2xl font-semibold">Add Description</h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 pb-4">
          <p className="dark:text-muted-foreground text-xs">
            Adding description will help us understand your problem
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-600 mx-6" />

        {/* Content */}
        <div className="p-6 space-y-6">

          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write here..."
              className="w-full h-40 bg-transparent border-none text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#4A4A68] resize-none text-lg leading-relaxed focus:outline-none focus:ring-0"
              maxLength={maxLength}
            />
            <div className="absolute bottom-3 right-3 text-sm">
              <span className="text-[#C4C4C4]">{message.length}</span>
              <span className="text-[#C4C4C4]">/</span>
              <span className="text-[#D0AEF5]">{maxLength}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              onClick={handleCancel}
              className="bg-[#F5F5F5] dark:bg-[#F5F5F524] border-gray-600 text-[#4B5563] dark:text-gray-300 font-semibold hover:bg-gray-700 hover:text-white px-8 py-2 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#9653DB] hover:bg-purple-700 text-white px-8 font-semibold py-2 rounded-lg"
              disabled={!message.trim()}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CallHistory = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentMonth, selectedDepartment, isAuthenticated, authLoading, departments, setCurrentMonth, setSelectedDepartment } = useApp();
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [flagDescription, setFlagDescription] = useState('');

  // Use scroll restoration for the main container
  const { scrollElementRef, navigateWithScrollSave } = useScrollRestoration('history-page');

  // Use persistent state for pagination
  const [page, setPage, clearPageState] = useListState('history-page', 1);
  const pageSize = 20;

  // Stop audio when navigating away from this page
  // useEffect(() => {
  //   return () => {
  //     stopAllAudio();
  //   };
  // }, [stopAllAudio]);

  // Build query parameters
  const getQueryParams = () => {
    const params = new URLSearchParams();

    // Add month filter if selected
    if (currentMonth) {
      const [monthName, year] = currentMonth.split(' ');
      const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
      params.append('month', `${year}-${monthNumber.toString().padStart(2, '0')}`);
    }

    // Add department filter if selected
    if (selectedDepartment && selectedDepartment !== 'all') {
      params.append('departmentId', selectedDepartment);
    }

    // Pagination
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    return params.toString() ? `?${params.toString()}` : '';
  };

  // Fetch calls using React Query
  const { data: calls, isLoading, error } = useQuery<CallsResponse>({
    queryKey: ['calls', currentMonth, selectedDepartment, page, pageSize],
    queryFn: () => apiClient.get(`/calls${getQueryParams()}`),
    enabled: !authLoading && isAuthenticated,
    placeholderData: (previousData, previousQuery) => previousData,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes for this specific query
  });

  // Flag call mutation 
  const flagCallMutation = useMutation({
    mutationFn: (data: { callId: number; description: string }) =>
      apiClient.post<ApiResponse<any>>(`/calls/${data.callId}/flag`, {
        description: data.description
      }),
    onSuccess: (response) => {
      setFlagModalOpen(false);
      setFlagDescription('');
      setSelectedCall(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      // Also invalidate the specific call details in case user is viewing it
      if (selectedCall) {
        queryClient.invalidateQueries({ queryKey: ['callDetails', selectedCall.id] });
      }

      console.log('Call flagged successfully:', response.data?.message);
    },
    onError: (err: AxiosError<ApiResponse<any>>) => {
      console.error('Error flagging call:', err);

      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }

      // Handle specific error cases
      const errorMessage = err.response?.data?.error?.message || 'Failed to flag call';

      if (err.response?.status === 409) {
        alert('This call has already been flagged as a complaint.');
      } else if (err.response?.status === 404) {
        alert('Call not found.');
      } else if (err.response?.status === 403) {
        alert('You are not authorized to flag this call.');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    },
  });

  const handleFlagClick = (call: Call) => {
    setSelectedCall(call);
    setFlagModalOpen(true);
  };

  const handleFlagSubmit = async (message: string) => {
    if (!selectedCall) return;

    flagCallMutation.mutate({
      callId: selectedCall.id,
      description: message
    });
  };

  const handleCardClick = (callId: number, e: React.MouseEvent) => {
    // Prevent navigation if clicking the flag button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigateWithScrollSave(`/history/${callId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please log in to access call history.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading calls...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error instanceof Error ? error.message : 'Failed to load calls'}</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['calls'] })}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalHeader title='Call History' />
      <div className="content-area bg-background px-4 md:px-6 lg:px-8 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-textColor">
                  All Calls
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  Showing all calls, 29 Aug 2025
                </p>
              </div>
            </div>

            {/* Filters and Pagination */}
            <div className="flex flex-wrap gap-3 items-center">
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
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {calls?.data?.map(call => {
            const cardId = `call-card-${call.id}`;
            return (
              <Card
                key={call.id}
                ref={scrollElementRef as React.RefObject<HTMLDivElement>}
                id={cardId}
                className="p-6 rounded-xl bg-card border-[4px] text-card-foreground border-[#9653DB1A] dark:border-[#2D2D2D85] cursor-pointer"
                onClick={(e) => handleCardClick(call.id, e)}
              >
                {/* Header with Customer Number and Flag Button */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">
                      Customer Number- {call.phoneNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex border border-[#FFFFFF29] px-2 py-1 rounded-md justify-end">
                      {call.isFlagged ? (
                        <div className="flex rounded-md items-center gap-2">
                          <Flag size={16} className="fill-current" />
                          <span className="text-sm">
                            Flagged 
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlagClick(call);
                          }}
                          className="flex items-center gap-2 hover:text-muted-foreground rounded-md transition-colors"
                          aria-label="Flag for Review"
                          title="Flag for Review"
                          disabled={flagCallMutation.isPending}
                        >
                          <span className="text-sm">Flag for Review</span>
                          <Bookmark size={20} strokeWidth={3} className="text-red-600" />
                        </button>
                      )}
                    </div>
                    {call.isFlagged && <IoEyeSharp />}
                  </div>


                </div>

                {/* Call Information */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      #{call.callNumber.replace('CALL-', '')}
                    </span>
                  </div>
                  <span className="px-3 py-1 text-sm rounded-full text-black dark:text-white bg-[#9653DB1A] dark:bg-[#9653DB33]">
                    {call.handledBy}
                  </span>
                  <div className="flex items-center bg-[#FFFFFF0D] px-3 py-0.5 rounded-full gap-2">
                    <Calendar size={14} />
                    <span className="text-sm text-muted-foreground dark:text-white">
                      {call.date}
                    </span>
                    <span className="dark:text-white">|</span>
                    <Clock size={14} />
                    <span className="text-sm text-muted-foreground dark:text-white">
                      {call.time}
                    </span>
                  </div>
                </div>

                {/* Description/Transcript */}
                <div className="mb-4 border-l-4 border-[#C5DAFF57] pl-4">
                  <h4 className="text-sm font-semibold mb-2">
                    Call Description
                  </h4>
                  <p className="text-muted-foreground line-clamp-2">
                    {call.transcript}
                  </p>
                </div>

                {/* Duration and Audio Player Row */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Duration - 2 minutes</span>
                  </div>
                  <div className="w-48">
                    <AudioPlayer
                      src={call.audioUrl}
                      callId={call.id}
                      callNumber={call.callNumber}
                      transcript={call.transcript}
                      cardId={cardId}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Pagination at the bottom */}
        <div className="flex items-center justify-center gap-1 mt-6 mb-4">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 text-black" />
          </Button>

          {/* Page Numbers */}
          {(() => {
            const totalPages = calls?.pagination?.totalPages || 1;
            const currentPage = calls?.pagination?.page ?? page;
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
                    ? 'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
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
                    ? 'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
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
                    ? 'bg-[#9653DB4D] text-white hover:bg-[#7236ad4d]'
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
            className="h-9 w-9 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
            onClick={() => {
              const totalPages = calls?.pagination?.totalPages || 1;
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            disabled={(() => {
              const totalPages = calls?.pagination?.totalPages;
              return totalPages ? page >= totalPages : false;
            })()}
          >
            <ChevronRight className="h-4 w-4 text-black" />
          </Button>
        </div>
      </div>

      {/* Custom Flag Popup */}
      <FlagPopup
        isOpen={flagModalOpen}
        onClose={() => setFlagModalOpen(false)}
        onSubmit={handleFlagSubmit}
      />
    </>
  );
};

export default CallHistory;
