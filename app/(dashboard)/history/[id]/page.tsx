"use client"
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Phone, Clock, Flag, Loader2 } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { apiClient, useAuthStore } from '@/lib/api';
import { useApp } from '@/context/GlobalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { 
    code: string;
    message: string;
  };
}

interface CallDetail {
  id: number;
  time: string;
  date: string;
  handledBy: string;
  phoneNumber: string;
  callNumber: string;
  transcript: string;
  audioUrl: string;
  chatTranscript: {
    messages: {
      role: string;
      content: unknown;
    }[];
  } | null;
  isFlagged: boolean;
  complaintInfo?: {
    complaintId: number;
    complaintStatus: string;
    flaggedAt: string;
  } | null;
}

const CallDetail = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, authLoading } = useApp();
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagDescription, setFlagDescription] = useState('');
  const { navigateBack } = useScrollRestoration();

  // Fetch call details using React Query
  const { data: callResponse, isLoading, error } = useQuery<ApiResponse<CallDetail>>({
    queryKey: ['callDetails', params.id],
    queryFn: () => apiClient.get(`/calls/${params.id}`),
    enabled: !authLoading && isAuthenticated && !!params.id,
    staleTime: 1000 * 60 * 10, // Call details rarely change, keep fresh for 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 - call doesn't exist
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['callDetails', params.id] });
      
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

  const handleFlagClick = () => {
    setFlagModalOpen(true);
  };

  const handleFlagSubmit = async () => {
    if (!callResponse?.data) return;
    
    flagCallMutation.mutate({
      callId: callResponse.data.id,
      description: flagDescription
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please log in to access call details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading call details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error instanceof Error ? error.message : 'Failed to load call details'}</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['callDetails', params.id] })}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!callResponse?.data) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600">Call Not Found</h2>
          <p className="text-gray-500 mt-2">The requested call could not be found.</p>
          <button 
            onClick={navigateBack}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const call = callResponse.data;

  const extractTextFromContent = (content: unknown): string => {
    if (content == null) {
      return '';
    }
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      // Try to extract text from array items
      const parts = content
        .map((item) => {
          if (item == null) return '';
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            // Common shapes: { text: { value } }, { text }, { content }
            const anyItem: any = item as any;
            if (typeof anyItem.text === 'string') return anyItem.text;
            if (anyItem.text && typeof anyItem.text.value === 'string') return anyItem.text.value;
            if (typeof anyItem.content === 'string') return anyItem.content;
            if (anyItem.content && typeof anyItem.content.text === 'string') return anyItem.content.text;
          }
          return '';
        })
        .filter(Boolean);
      return parts.join(' ').trim();
    }
    if (typeof content === 'object') {
      // Some backends may nest message-like objects inside content: { role, content }
      const anyContent: any = content as any;
      if (typeof anyContent.content === 'string') return anyContent.content;
      if (Array.isArray(anyContent.content)) return extractTextFromContent(anyContent.content);
      if (anyContent.text && typeof anyContent.text === 'string') return anyContent.text;
      if (anyContent.text && typeof anyContent.text.value === 'string') return anyContent.text.value;
      try {
        return JSON.stringify(content);
      } catch {
        return '';
      }
    }
    return String(content);
  };

  return (
    <div className="content-area h-screen flex flex-col overflow-hidden">
      <div className="flex-none">
        <Header title={`Call #${call.callNumber}`} showBackButton={true} onBackClick={navigateBack} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Call Details */}
        <div className="w-1/3 border-r border-gray-200 shadow-md p-4 overflow-y-auto">
          <Card className="p-4 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">
                  {call.time} - {call.date}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">{call.phoneNumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`
                  px-2 py-1 text-xs rounded-full 
                  ${call.handledBy === 'Claire' ? 'bg-blue-100 text-accent' : 'bg-green-100 text-green-700'}
                `}>
                  {call.handledBy}
                </span>
              </div> 

              <div className="w-full">
                <AudioPlayer 
                  src={call.audioUrl} 
                  callId={call.id}
                  callNumber={call.callNumber}
                  transcript={call.transcript}
                  cardId={`call-detail-${call.id}`}
                />
              </div>

              {call.isFlagged ? (
                <div className="flex items-center gap-2 text-orange-600">
                  <Flag size={16} className="fill-current" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Already Flagged</span>
                    <span className="text-xs">Status: {call.complaintInfo?.complaintStatus}</span>
                    <span className="text-xs">
                      Flagged: {new Date(call.complaintInfo?.flaggedAt || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleFlagClick}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 rounded-md"
                  disabled={flagCallMutation.isPending}
                >
                  <Flag size={16} />
                  <span>Flag for Review</span>
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Chat Transcript */}
        <div className="w-2/3 p-4 rounded-md shadow-md overflow-y-auto bg-gray-50">
          <div className="max-w-3xl mx-auto space-y-4">
              {call.chatTranscript && call.chatTranscript.messages && call.chatTranscript.messages.length > 0 ? (
                call.chatTranscript.messages.map((message, index: number) => (
                <div 
                  key={index}
                  className={`flex ${message.role === 'Human' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`
                      max-w-[70%] rounded-lg p-3
                      ${message.role === 'Human'
                        ? 'bg-[#0B6BAF] text-white' 
                        : 'bg-white border border-gray-200'
                      }
                    `}
                  >
                    <div className="text-sm">
                        {extractTextFromContent(message.content)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">
                <p>No chat transcript available for this call.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Call for Review</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the issue or reason for flagging..."
              value={flagDescription}
              onChange={(e) => setFlagDescription(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setFlagModalOpen(false)}
              disabled={flagCallMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFlagSubmit}
              disabled={!flagDescription.trim() || flagCallMutation.isPending}
            >
              {flagCallMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Flagging...
                </>
              ) : (
                'Flag Call'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallDetail; 