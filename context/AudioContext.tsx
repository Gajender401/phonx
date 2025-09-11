'use client'
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface AudioContextType {
  currentAudio: {
    id: number;
    src: string;
    callNumber: string;
    transcript: string;
    cardId?: string; // ID of the card element to scroll to
  } | null;
  setCurrentAudio: (audio: AudioContextType['currentAudio']) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  scrollToCard: () => void;
  stopAllAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentAudio, setCurrentAudio] = useState<AudioContextType['currentAudio']>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const prevPathnameRef = useRef(pathname);
  const audioElementsRef = useRef<Set<HTMLAudioElement>>(new Set());

  const scrollToCard = useCallback(() => {
    if (currentAudio?.cardId) {
      const element = document.getElementById(currentAudio.cardId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a highlight effect
        element.classList.add('highlight-card');
        setTimeout(() => {
          element.classList.remove('highlight-card');
        }, 2000);
      }
    }
  }, [currentAudio?.cardId]);

  const stopAllAudio = useCallback(() => {
    console.log('stopAllAudio called');
    
    // Stop all HTML5 audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        console.log('Pausing audio element:', audio.src);
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // Stop tracked audio elements
    audioElementsRef.current.forEach(audio => {
      if (!audio.paused) {
        console.log('Pausing tracked audio element:', audio.src);
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // Stop Web Audio API contexts
    try {
      // Find all WaveSurfer instances and stop them
      if (typeof window !== 'undefined') {
        const waveSurferElements = document.querySelectorAll('[data-wavesurfer]');
        waveSurferElements.forEach(element => {
          const wavesurfer = (element as any).wavesurfer;
          if (wavesurfer && wavesurfer.isPlaying && wavesurfer.isPlaying()) {
            console.log('Stopping WaveSurfer instance');
            wavesurfer.pause();
          }
        });
      }
    } catch (error) {
      console.log('Error stopping WaveSurfer instances:', error);
    }

    // Update state
    setCurrentAudio(null);
    setIsPlaying(false);
  }, []);

  // Register audio element for tracking
  const registerAudioElement = useCallback((audio: HTMLAudioElement) => {
    audioElementsRef.current.add(audio);
    return () => {
      audioElementsRef.current.delete(audio);
    };
  }, []);

  // More reliable pathname change detection
  useEffect(() => {
    console.log('Pathname changed:', prevPathnameRef.current, '->', pathname);
    
    if (prevPathnameRef.current !== pathname) {
      // Always stop audio on any route change for now
      // This ensures audio stops regardless of the route
      console.log('Route changed, stopping all audio');
      stopAllAudio();
      prevPathnameRef.current = pathname;
    }
  }, [pathname, stopAllAudio]);

  // Enhanced navigation detection
  useEffect(() => {
    let isNavigating = false;
    let lastUrl = window.location.href;

    const handleBeforeUnload = () => {
      console.log('Page unload detected');
      stopAllAudio();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, stopping audio');
        stopAllAudio();
      }
    };

    const handleFocus = () => {
      // Check if we're on a different page after focus returns
      const currentPath = window.location.pathname;
      if (currentPath !== prevPathnameRef.current) {
        console.log('Focus returned with different path, stopping audio');
        stopAllAudio();
        prevPathnameRef.current = currentPath;
      }
    };

    // Detect URL changes using MutationObserver and polling as fallback
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log('URL change detected via polling:', lastUrl, '->', currentUrl);
        stopAllAudio();
        lastUrl = currentUrl;
        prevPathnameRef.current = window.location.pathname;
      }
    };

    // Poll for URL changes every 500ms as ultimate fallback
    const urlCheckInterval = setInterval(checkUrlChange, 500);

    // Enhanced click detection for navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only treat anchors with href, or elements explicitly marked for navigation, as navigation
      const navEl = target.closest('a[href], [data-nav], [data-navigation]') as HTMLElement | null;

      if (!navEl) return;

      const href = navEl.getAttribute('href');
      const dataNav = navEl.hasAttribute('data-nav') || !!navEl.closest('[data-navigation]');

      if (!href && !dataNav) return;

      console.log('Navigation element clicked, flagging for audio stop');
      isNavigating = true;

      // Stop immediately when navigating away to a different route or external link
      if (href && (href.startsWith('http') || href.startsWith('/'))) {
        const currentPath = window.location.pathname;
        const targetPath = href.startsWith('/') ? href : currentPath;

        if (targetPath !== currentPath) {
          console.log('Different route detected, stopping audio immediately');
          stopAllAudio();
        }
      }

      // Fallback: if navigation proceeds asynchronously, ensure audio stops shortly after
      setTimeout(() => {
        if (isNavigating) {
          console.log('Navigation timeout reached, stopping audio');
          stopAllAudio();
          isNavigating = false;
        }
      }, 100);
    };

    // Reset navigation flag on certain events
    const resetNavigationFlag = () => {
      isNavigating = false;
    };

    // Add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('click', handleClick, true); // Use capture phase
      window.addEventListener('popstate', stopAllAudio);
      
      // Reset navigation flag on these events
      document.addEventListener('mouseup', resetNavigationFlag);
      document.addEventListener('keyup', resetNavigationFlag);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('click', handleClick, true);
        window.removeEventListener('popstate', stopAllAudio);
        document.removeEventListener('mouseup', resetNavigationFlag);
        document.removeEventListener('keyup', resetNavigationFlag);
        clearInterval(urlCheckInterval);
      }
    };
  }, [stopAllAudio]);

  return (
    <AudioContext.Provider value={{ currentAudio, setCurrentAudio, isPlaying, setIsPlaying, scrollToCard, stopAllAudio }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 