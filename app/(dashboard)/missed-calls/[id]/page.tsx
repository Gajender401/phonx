"use client"
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Phone, Clock, Flag, Loader2, Building, User } from 'lucide-react';
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

interface MissedCallDetail {
  id: number;
  aiConversationId: number;
  brandId: string;
  departmentId: number;
  enduserPhonenumber: string;
  location: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  highLevelDescription: string;
  voiceInteraction: {
    id: number;
    brandId: string;
    departmentId: number;
    staffId: number;
    transcript: {
      messages: {
        role: string;
        content: string;
      }[];
    };
    customerName: string;
    highLevelDescription: string;
    endUserPhoneNumber: string;
    routedStatus: boolean;
    conversationAudioUrl: string;
    createdAt: string;
  };
  brand: {
    id: string;
    brandName: string;
    ownerName: string;
    ownerEmailAddress: string;
    companySize: number;
    companyAddress: string;
    companyEmailAddress: string;
    phoneNumber: string;
    knowledgeId: string | null;
    createdAt: string;
  };
  department: {
    id: number;
    departmentName: string;
    createdAt: string;
  };
}

const MissedCallDetail = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, authLoading } = useApp();
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagDescription, setFlagDescription] = useState('');
  const { navigateBack } = useScrollRestoration();

  // Fetch missed call details using React Query
  const { data: callResponse, isLoading, error } = useQuery<ApiResponse<MissedCallDetail>>({
    queryKey: ['missedCallDetails', params.id],
    queryFn: () => apiClient.get(`/miss-calls/${params.id}`),
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
      apiClient.post<ApiResponse<any>>(`/miss-calls/${data.callId}/flag`, {
        description: data.description
      }),
    onSuccess: (response) => {
      setFlagModalOpen(false);
      setFlagDescription('');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['missedCalls'] });
      queryClient.invalidateQueries({ queryKey: ['missedCallDetails', params.id] });
      
      console.log('Missed call flagged successfully:', response.data?.message);
    },
    onError: (err: AxiosError<ApiResponse<any>>) => {
      console.error('Error flagging missed call:', err);
      
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      
      // Handle specific error cases
      const errorMessage = err.response?.data?.error?.message || 'Failed to flag missed call';
      
      if (err.response?.status === 409) {
        alert('This missed call has already been flagged as a complaint.');
      } else if (err.response?.status === 404) {
        alert('Missed call not found.');
      } else if (err.response?.status === 403) {
        alert('You are not authorized to flag this missed call.');
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
          <p className="text-gray-600 mt-2">Please log in to access missed call details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading missed call details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error instanceof Error ? error.message : 'Failed to load missed call details'}</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['missedCallDetails', params.id] })}
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
          <h2 className="text-xl font-semibold text-gray-600">Missed Call Not Found</h2>
          <p className="text-gray-500 mt-2">The requested missed call could not be found.</p>
          <button 
            onClick={navigateBack}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Back to Missed Calls
          </button>
        </div>
      </div>
    );
  }

  const call = callResponse.data;

  return (
    <div className="content-area h-screen flex flex-col overflow-hidden">
      <div className="flex-none">
        <Header title={`Missed Call #${call.id}`} showBackButton={true} onBackClick={navigateBack} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Call Details */}
        <div className="w-1/3 border-r border-gray-200 shadow-md p-4 overflow-y-auto">
          <Card className="p-4 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">
                  {new Date(call.createdAt).toLocaleDateString()} - {new Date(call.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">{call.enduserPhonenumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">{call.voiceInteraction.customerName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Building size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">{call.brand.brandName}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`
                  px-2 py-1 text-xs rounded-full 
                  ${call.status === 'no-answer' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                `}>
                  {call.status === 'no-answer' ? 'No Answer' : call.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-accent">
                  {call.department.departmentName}
                </span>
              </div>

              {call.voiceInteraction.conversationAudioUrl && (
                <div className="w-full">
                  <AudioPlayer 
                    src={call.voiceInteraction.conversationAudioUrl} 
                    callId={call.id}
                    callNumber={call.id.toString()}
                    transcript={call.highLevelDescription}
                    cardId={`missed-call-detail-${call.id}`}
                  />
                </div>
              )}

              <button 
                onClick={handleFlagClick}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 rounded-md"
                disabled={flagCallMutation.isPending}
              >
                <Flag size={16} />
                <span>Flag for Review</span>
              </button>

              {call.location && call.location !== 'N/A' && (
                <div className="text-sm text-gray-500">
                  <strong>Location:</strong> {call.location}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Chat Transcript and Description */}
        <div className="w-2/3 p-4 rounded-md shadow-md overflow-y-auto bg-gray-50">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* High Level Description */}
            <Card className="p-4 bg-white">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Call Summary</h3>
              <p className="text-gray-700 leading-relaxed">{call.highLevelDescription}</p>
            </Card>

            {/* Chat Transcript */}
            <Card className="p-4 bg-white">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversation Transcript</h3>
              <div className="space-y-4">
                {call.voiceInteraction.transcript && call.voiceInteraction.transcript.messages && call.voiceInteraction.transcript.messages.length > 0 ? (
                  call.voiceInteraction.transcript.messages.map((message, index: number) => (
                    <div 
                      key={index}
                      className={`flex ${message.role === 'User' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          max-w-[70%] rounded-lg p-3
                          ${message.role === 'User'
                            ? 'bg-[#0B6BAF] text-white' 
                            : 'bg-white border border-gray-200'
                          }
                        `}
                      >
                        <div className="text-sm">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No conversation transcript available for this missed call.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Brand and Department Info */}
            <Card className="p-4 bg-white">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Brand:</span>
                  <p className="text-gray-800">{call.brand.brandName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Department:</span>
                  <p className="text-gray-800 capitalize">{call.department.departmentName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Company Address:</span>
                  <p className="text-gray-800">{call.brand.companyAddress}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Company Size:</span>
                  <p className="text-gray-800">{call.brand.companySize} employees</p>
                </div>
                {call.voiceInteraction.routedStatus !== null && (
                  <div>
                    <span className="font-medium text-gray-600">Routed Status:</span>
                    <p className="text-gray-800">{call.voiceInteraction.routedStatus ? 'Routed' : 'Not Routed'}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Missed Call for Review</DialogTitle>
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

export default MissedCallDetail;
