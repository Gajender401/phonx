'use client'
import React from 'react';
import { useLoadingStore } from '@/lib/api';
import { OverlayLoader } from './Loader';

const GlobalLoader: React.FC = () => {
  const { isLoading } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <OverlayLoader 
      useCustomLogo={true}
      size="lg"
    />
  );
};

export default GlobalLoader; 