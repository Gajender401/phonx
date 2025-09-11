'use client'
import React from 'react';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('./pdf-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] border rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
        <p className="text-gray-600">Loading PDF viewer...</p>
      </div>
    </div>
  )
});

interface PDFWrapperProps {
  url: string;
  title: string;
}

const PDFWrapper: React.FC<PDFWrapperProps> = ({ url, title }) => {
  return <PDFViewer url={url} title={title} />;
};

export default PDFWrapper; 