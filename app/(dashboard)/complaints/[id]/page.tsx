"use client"
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import AudioPlayer from '@/components/AudioPlayer';
import { complaintsApi, type Complaint } from '@/lib/api';
import { useLoadingStore } from '@/lib/api';
import { useApp } from '@/context/GlobalContext';

const getDepartmentColor = (department: string) => {
  switch (department) {
    case 'Sales':
      return 'bg-blue-100 text-blue-700';
    case 'Customer Service':
      return 'bg-green-100 text-green-700';
    case 'Technical Support':
      return 'bg-purple-100 text-purple-700';
    case 'Quality Assurance':
      return 'bg-yellow-100 text-yellow-700'; 
    case 'Shipping':
      return 'bg-orange-100 text-orange-700';
    case 'Returns':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const ComplaintDetail = () => {
  const params = useParams();
  const { isAuthenticated, authLoading } = useApp();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const isLoading = useLoadingStore((state) => state.isLoading);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchComplaintDetails();
    }
  }, [params.id, authLoading, isAuthenticated]);

  const fetchComplaintDetails = async () => {
    try {
      const result = await complaintsApi.getComplaintById(Number(params.id));
      setComplaint(result);
    } catch (error) {
      console.error('Error fetching complaint details:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <p>Complaint not found</p>
      </div>
    );
  }

  // Handle the transcript data - the backend returns conversations as an array directly
  const transcript = complaint.conversations || [];

  const extractTextFromContent = (content: unknown): string => {
    if (content == null) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((item) => extractTextFromContent(item))
        .filter(Boolean)
        .join(' ')
        .trim();
    }
    if (typeof content === 'object') {
      const obj: any = content as any;
      if (typeof obj.content === 'string') return obj.content;
      if (Array.isArray(obj.content)) return extractTextFromContent(obj.content);
      if (typeof obj.text === 'string') return obj.text;
      if (obj.text && typeof obj.text.value === 'string') return obj.text.value;
      // Common LLM shape: { role, content }
      if (obj.role && obj.content) return extractTextFromContent(obj.content);
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
        <Header title={`Complaint #${complaint.complaintNumber}`} showBackButton={true} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Complaint Details */}
        <div className="w-1/3 border-r border-gray-200 shadow-md p-4 overflow-y-auto">
          <Card className="p-4 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">{complaint.brandName}</span>
                <span className="text-sm text-gray-500">
                  {complaint.time} - {complaint.date}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getDepartmentColor(complaint.department)}`}>
                  {complaint.department}
                </span>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-1">Complaint Message:</p>
                <p className="text-xs text-gray-600">{complaint.description}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Phone: {complaint.phoneNumber}</p>
                </div>
              </div>

              {complaint.audioUrl && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recording</h3>
                  <div className="w-full">
                    <AudioPlayer 
                      src={complaint.audioUrl} 
                      callId={complaint.id}
                      callNumber={complaint.complaintNumber}
                      transcript={complaint.description}
                      cardId={`complaint-detail-${complaint.id}`}
                      isComplaint={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Conversation Transcript */}
        <div className="w-2/3 flex flex-col p-4">
          <div className="flex-1 rounded-md shadow-md overflow-y-auto bg-gray-50 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Call Transcript</h3>
              
              {transcript && transcript.length > 0 ? (
                transcript.map((message: any, index: number) => (
                  <div 
                    key={index}
                    className={`flex ${message.sender === 'Support' || message.sender === 'Staff' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`
                        max-w-[70%] rounded-lg p-3
                        ${message.sender === 'Support' || message.sender === 'Staff'
                          ? 'bg-white border border-gray-200' 
                          : 'bg-[#0B6BAF] text-white'
                        }
                      `}
                    >
                      <div className="text-sm font-medium mb-1">
                        {message.sender === 'Support' || message.sender === 'Staff' ? 'Support' : 'Customer'}
                      </div>
                      <div className="text-sm">
                        {extractTextFromContent(message.message) || extractTextFromContent(message.transcript) || 'No message content'}
                      </div>
                      <div className={`text-xs mt-1 ${
                        message.sender === 'Support' || message.sender === 'Staff' 
                          ? 'text-gray-500' 
                          : 'text-blue-100'
                      }`}>
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No transcript available for this complaint.</p>
                  <p className="text-sm mt-2">The conversation may not have been recorded or processed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;