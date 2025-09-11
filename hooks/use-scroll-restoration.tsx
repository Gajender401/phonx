'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ScrollPosition {
  x: number;
  y: number;
}

// Global storage for scroll positions
const scrollPositions = new Map<string, ScrollPosition>();

export function useScrollRestoration(key?: string) {
  const pathname = usePathname();
  const router = useRouter();
  const scrollElementRef = useRef<HTMLElement | null>(null);
  
  // Use provided key or pathname as default
  const scrollKey = key || pathname;

  // Function to save current scroll position
  const saveScrollPosition = () => {
    const element = scrollElementRef.current;
    if (element) {
      scrollPositions.set(scrollKey, {
        x: element.scrollLeft,
        y: element.scrollTop
      });
    } else {
      // Fallback to window scroll
      scrollPositions.set(scrollKey, {
        x: window.scrollX,
        y: window.scrollY
      });
    }
  };

  // Function to restore scroll position
  const restoreScrollPosition = () => {
    const savedPosition = scrollPositions.get(scrollKey);
    if (savedPosition) {
      const element = scrollElementRef.current;
      if (element) {
        element.scrollTo({
          left: savedPosition.x,
          top: savedPosition.y,
          behavior: 'instant'
        });
      } else {
        // Fallback to window scroll
        window.scrollTo({
          left: savedPosition.x,
          top: savedPosition.y,
          behavior: 'instant'
        });
      }
    }
  };

  // Function to clear saved position
  const clearScrollPosition = () => {
    scrollPositions.delete(scrollKey);
  };

  // Enhanced navigation functions
  const navigateWithScrollSave = (path: string) => {
    saveScrollPosition();
    router.push(path);
  };

  const navigateBack = () => {
    // Use browser back for better state preservation
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to parent page
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 1) {
        pathSegments.pop();
        router.push('/' + pathSegments.join('/'));
      } else {
        router.push('/');
      }
    }
  };

  // Save scroll position before navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save on page visibility change (covers most navigation cases)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [scrollKey]);

  // Restore scroll position on mount
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      restoreScrollPosition();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [scrollKey]);

  return {
    scrollElementRef,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
    navigateWithScrollSave,
    navigateBack
  };
}

// Hook for list pages to maintain state
export function useListState<T = any>(key: string, initialState: T) {
  const stateKey = `listState_${key}`;
  
  // Get initial state from sessionStorage or use provided initial state
  const getInitialState = (): T => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(stateKey);
        return saved ? JSON.parse(saved) : initialState;
      } catch {
        return initialState;
      }
    }
    return initialState;
  };

  const [state, setStateInternal] = React.useState<T>(getInitialState);

  const setState = (newState: T | ((prev: T) => T)) => {
    const updatedState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(state) 
      : newState;
    
    setStateInternal(updatedState);
    
    // Save to sessionStorage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(stateKey, JSON.stringify(updatedState));
      } catch (error) {
        console.warn('Failed to save list state:', error);
      }
    }
  };

  const clearState = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(stateKey);
    }
    setStateInternal(initialState);
  };

  return [state, setState, clearState] as const;
}
