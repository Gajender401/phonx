"use client"
import React from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Loader2, Building } from 'lucide-react';
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
      <img
        src="/gradient.svg"
        alt="Gradient"
        className="absolute top-0 right-0 w-screen h-screen pointer-events-none z-0"
      />
      <div className="content-area px-4 md:px-6 lg:px-8 max-w-full overflow-x-hidden relative z-10">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <Header title={`Call ${call.id}`} showBackButton={true} onBackClick={navigateBack} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {/* Left Panel - Call Details */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-[550px] flex flex-col bg-[#FFFFFF1A] rounded-[12px]">
                <h2 className="text-2xl font-semibold mb-12">Call Details</h2>
              <div className="space-y-10">

                {/* Name */}
                <div className="flex items-center gap-2">
                    <img src="/icons/call-name.svg" alt="Name" className="w-16 h-16" />
                  <div>
                    <p className="text-2xl text-[#E1E1E1]">Name</p>
                    <p className="font-medium">{call.voiceInteraction.customerName || 'Unknown'}</p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-2">
                    <img src="/icons/call-phone.svg" alt="Phone" className="w-16 h-16" />
                  <div>
                    <p className="text-2xl text-[#E1E1E1]">Phone No.</p>
                    <p className="font-medium">{call.enduserPhonenumber}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2">
                    <img src="/icons/call-time.svg" alt="Time" className="w-16 h-16" />
                  <div>
                    <p className="text-2xl text-[#E1E1E1]">Time</p>
                    <p className="font-medium">{new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2">
                    <img src="/icons/call-duration.svg" alt="Duration" className="w-16 h-16" />
                  <div>
                    <p className="text-2xl text-[#E1E1E1]">Duration</p>
                    <p className="font-medium">02:56</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Chat Transcript */}
          <div className="lg:col-span-5">
            <Card className="h-[550px] flex flex-col bg-[#FFFFFF1A] rounded-[12px]">
              {/* Chat Header */}
              <div className="p-6">
                <h2 className="text-2xl font-semibold">Call Transcript</h2>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {call.voiceInteraction.transcript && call.voiceInteraction.transcript.messages && call.voiceInteraction.transcript.messages.length > 0 ? (
                  call.voiceInteraction.transcript.messages.map((message, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 ${message.role === 'Human' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role !== 'Human' && (
                        <img
                          src="/icons/ai.svg"
                          alt="AI"
                          className="w-[35px] h-[35px] flex-shrink-0"
                        />
                      )}
                      <div
                        className="max-w-[70%] rounded-2xl px-4 py-2 text-sm text-white"
                        style={{
                          backgroundColor: message.role === 'Human' ? '#9653DB33' : '#F1F1F11A'
                        }}
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
              <h3 className="text-2xl font-semibold mb-4">Call Recording</h3>
            <div className='bg-[#0000001A] rounded-[42px] px-10 pt-10 pb-5' >
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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default MissedCallDetail;
