'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevent refetch when the window regains focus
            refetchOnWindowFocus: false,
            // Prevent refetch when the browser reconnects
            refetchOnReconnect: false,
            // Only refetch on mount if data is stale
            refetchOnMount: true,
            // Keep data fresh for longer to leverage cache when navigating back
            staleTime: 1000 * 60 * 5, // 5 minutes
            // Keep data in cache longer for navigation performance
            gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime in v4)
            // Enable background refetching to keep data up to date
            refetchInterval: false,
            retry: (failureCount, error: any) => {
              // Don't retry on 401/403 errors
              if (error?.response?.status === 401 || error?.response?.status === 403) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}