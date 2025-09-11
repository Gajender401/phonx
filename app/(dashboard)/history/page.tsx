"use client"
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Phone, Flag, Clock, ChevronLeft, ChevronRight, Bookmark, X } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { AxiosError } from 'axios';
import { useApp } from '@/context/GlobalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useScrollRestoration, useListState } from '@/hooks/use-scroll-restoration';
import Image from 'next/image';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #111111 26%, #DCE1E8 100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.svg" 
              alt="PHONXAI" 
              width={120} 
              height={120}
              className="w-24 h-24"
            />
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-16 pb-20 space-y-5">
          <div className="text-center">
            <h3 className="text-white text-3xl font-semibold mb-2">
              Please describe what made you flag this <br /> call transcript
            </h3>
            <p className="text-white/80 mt-5 text-xl">
              It also help us make your system better
            </p>
          </div>

          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message......."
              className="w-full h-40 bg-white/10 border-white/30 text-white placeholder:text-white/60 resize-none"
              maxLength={maxLength}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {message.length} / {maxLength}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              className="bg-[#0B6BAF] hover:bg-[#0B6BAF]/90 text-white px-8 py-2 rounded-md font-medium"
              disabled={!message.trim()}
            >
              Flag
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
  const { currentMonth, selectedDepartment, isAuthenticated, authLoading } = useApp();
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
    <div className="content-area h-screen flex flex-col overflow-hidden">
      <div className="flex-none">
        <Header 
          title="Call History" 
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
                Page {calls?.pagination?.page ?? page} {calls?.pagination?.totalPages ? `of ${calls.pagination.totalPages}` : ''}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9" 
                onClick={() => {
                  const totalPages = calls?.pagination?.totalPages || 1;
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={(() => {
                  const totalPages = calls?.pagination?.totalPages;
                  return totalPages ? page >= totalPages : false;
                })()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      </div>

      <div 
        ref={scrollElementRef as React.RefObject<HTMLDivElement>}
        className="flex-1 overflow-y-auto px-4 pb-4"
      >
        <div className="grid grid-cols-1 gap-5">
          {calls?.data?.map(call => {
            const cardId = `call-card-${call.id}`;
            return (
              <Card 
                key={call.id} 
                id={cardId}
                className="p-5 component-shadow card-radius bg-white transition-all duration-300 cursor-pointer hover:bg-gray-50"
                onClick={(e) => handleCardClick(call.id, e)}
              >
                <div className="flex flex-row justify-between gap-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1">
                      {/* Date + handler badge + Audio player */}
                      <div className="flex flex-row gap-3">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-500" />
                          <span className="text-sm text-gray-500">
                            {call.time} - {call.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`
                              px-2 py-1 text-xs rounded-full 
                              ${call.handledBy === 'Claire'
                                ? 'bg-blue-100 text-accent'
                                : 'bg-green-100 text-green-700'
                              }`}
                          >
                            {call.handledBy}
                          </span>
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
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Phone size={16} />
                        <span>{call.phoneNumber}</span>
                      </div>

                      {/* Transcript */}
                      <div>
                        <p className="text-gray-700 line-clamp-2">
                          {call.transcript}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex justify-between flex-col min-w-36 items-end' >
                    <div className="flex justify-end ">
                      {call.isFlagged ? (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Flag size={16} className="fill-current" />
                          <span className="text-sm">
                            Flagged ({call.complaintInfo?.complaintStatus})
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlagClick(call);
                          }}
                          className="flex items-center gap-2 text-gray-900 hover:text-gray-700 rounded-md"
                          aria-label="Flag for Review"
                          title="Flag for Review"
                          disabled={flagCallMutation.isPending}
                        >
                          <span className="text-sm text-gray-900">Flag for Review</span>
                          <Bookmark size={20} strokeWidth={3} className="text-red-600" />
                        </button>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <h3 className="font-medium text-gray-600">#{call.callNumber}</h3>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Flag Popup */}
      <FlagPopup
        isOpen={flagModalOpen}
        onClose={() => setFlagModalOpen(false)}
        onSubmit={handleFlagSubmit}
      />
    </div>
  );
};

export default CallHistory;
