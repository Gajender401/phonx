"use client"
import React from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Phone, Clock, Loader2, Building, User } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';
import { apiClient } from '@/lib/api';
import { useApp } from '@/context/GlobalContext';
import { useQuery } from '@tanstack/react-query';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
import { GlobalHeader } from '@/components/layout/GlobalHeader';

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
  const { isAuthenticated, authLoading } = useApp();
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


  if (!isAuthenticated) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please log in to access escalated call details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Loading escalated call details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error instanceof Error ? error.message : 'Failed to load escalated call details'}</p>
          <button
            onClick={() => window.location.reload()}
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
          <h2 className="text-xl font-semibold text-gray-600">Escalated Call Not Found</h2>
          <p className="text-gray-500 mt-2">The requested escalated call could not be found.</p>
          <button
            onClick={navigateBack}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Back to Escalated Calls
          </button>
        </div>
      </div>
    );
  }

  const call = callResponse.data;

  return (
    <>
      <GlobalHeader />
      <div className="content-area px-4 md:px-6 lg:px-8 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <Header title={`Call ${call.id}`} showBackButton={true} onBackClick={navigateBack} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left Panel - Call Details */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-[550px] flex flex-col bg-[#FFFFFF1A] rounded-[12px]">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6">Call Details</h2>

                {/* Name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{call.voiceInteraction.customerName || 'Unknown'}</p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <Phone size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone No.</p>
                    <p className="font-medium">{call.enduserPhonenumber}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <Clock size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <Clock size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">02:56</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Chat Transcript */}
          <div className="lg:col-span-2">
            <Card className="h-[550px] flex flex-col bg-[#FFFFFF1A] rounded-[12px]">
              {/* Chat Header */}
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Call Transcript</h2>
                <p className="text-sm text-muted-foreground mt-1">Date: {new Date(call.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {call.voiceInteraction.transcript && call.voiceInteraction.transcript.messages && call.voiceInteraction.transcript.messages.length > 0 ? (
                  call.voiceInteraction.transcript.messages.map((message, index: number) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'User' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                        max-w-[70%] rounded-2xl px-4 py-2 text-sm
                        ${message.role === 'User'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                          }
                      `}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No conversation transcript available for this call.</p>
                  </div>
                )}
              </div>

            </Card>
          </div>
        </div>

        {/* Audio Player Panel - Full Width at Bottom */}
        <div className="mt-6">
          <Card className="p-6 bg-[#FFFFFF1A] rounded-[12px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Call Recording</h3>
              <div className="text-sm text-muted-foreground">
                Duration: 02:56
              </div>
            </div>
            {call.voiceInteraction.conversationAudioUrl ? (
              <AudioPlayer
                src={call.voiceInteraction.conversationAudioUrl}
                callId={call.id}
                callNumber={call.id.toString()}
                transcript={call.highLevelDescription}
                cardId={`missed-call-detail-${call.id}`}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No audio recording available for this call.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default MissedCallDetail;
