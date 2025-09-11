"use client";
import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

/**
 * AudioTestUtility - A development component to test audio stopping functionality
 * This component should only be used during development/testing
 */
const AudioTestUtility: React.FC = () => {
  const { currentAudio, isPlaying, stopAllAudio } = useAudio();
  const router = useRouter();

  const testNavigation = (route: string) => {
    console.log(`Testing navigation to: ${route}`);
    router.push(route);
  };

  const forceStopAudio = () => {
    console.log('Manually stopping all audio');
    stopAllAudio();
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 rounded p-4 shadow-lg z-50">
      <h3 className="font-bold text-sm mb-2">Audio Test Utility (Dev Only)</h3>
      
      <div className="mb-2 text-xs">
        <p>Audio Playing: {isPlaying ? 'Yes' : 'No'}</p>
        <p>Current Audio: {currentAudio ? `ID ${currentAudio.id}` : 'None'}</p>
      </div>

      <div className="space-y-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={forceStopAudio}
          className="w-full text-xs"
        >
          Force Stop Audio
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => testNavigation('/dashboard')}
          className="w-full text-xs"
        >
          Test Nav: Dashboard
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => testNavigation('/dashboard/history')}
          className="w-full text-xs"
        >
          Test Nav: History
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => testNavigation('/dashboard/settings')}
          className="w-full text-xs"
        >
          Test Nav: Settings
        </Button>
      </div>
    </div>
  );
};

export default AudioTestUtility;