'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { vkgApiService, transformVKGToFAQ } from '@/lib/vkg-api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/context/GlobalContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  department: string;
  routing_status: boolean;
  requirement_gathering?: string;
  how_to_gather_requirement?: string;
}

const departments = ['All Departments', 'Claims', 'Policy', 'General'];
const ITEMS_PER_PAGE = 25; // Items fetched from API per page
const DISPLAY_ITEMS = 10; // Items shown in table per display page
const PRELOAD_THRESHOLD = 15; // Start preloading when 15 items remain

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [currentPage, setCurrentPage] = useState(1); // Starting API page
  const [displayPage, setDisplayPage] = useState(1); // Display page within current API page
  const [loadedPages, setLoadedPages] = useState<{[key: number]: FAQItem[]}>({}); // Cache for loaded API pages
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set()); // Track which pages are being loaded
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQItem | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, authLoading } = useApp();

  // Memoize trimmed search term to prevent unnecessary re-renders and API calls
  const trimmedSearchTerm = React.useMemo(() => searchTerm.trim(), [searchTerm]);

  // Debounced search term for API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  // Debounce search term to avoid excessive API calls
  React.useEffect(() => {
    // Set searching state immediately when user starts typing
    if (trimmedSearchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(trimmedSearchTerm);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timer);
      // Don't reset isSearching here as it creates flickering
    };
  }, [trimmedSearchTerm, debouncedSearchTerm]);

  // Create stable search key for React Query - use empty string for no search to avoid cache conflicts
  const searchKey = React.useMemo(() => {
    return debouncedSearchTerm === '' ? 'empty' : debouncedSearchTerm;
  }, [debouncedSearchTerm]);

  // Function to fetch a specific page
  const fetchPage = React.useCallback(async (page: number) => {
    const params = {
      page: page,
      page_size: ITEMS_PER_PAGE,
      department: selectedDepartment === 'All Departments' ? undefined : selectedDepartment,
      q: debouncedSearchTerm || undefined,
    };
    const response = await vkgApiService.getAllQuestions('document_0', params);
    return transformVKGToFAQ(response);
  }, [debouncedSearchTerm, selectedDepartment]);

  // Fetch initial page using React Query
  const { data: initialFaqs = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['faqs', searchKey, selectedDepartment],
    queryFn: () => fetchPage(1),
    enabled: !authLoading && isAuthenticated,
    staleTime: debouncedSearchTerm ? 1000 * 30 : 1000 * 60 * 5, // Shorter cache for search results
    gcTime: debouncedSearchTerm ? 1000 * 60 * 2 : 1000 * 60 * 10, // Shorter garbage collection for search
    retry: 2, // Retry failed requests up to 2 times
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Always refetch when component mounts to ensure fresh data
  });

  // Update loaded pages when initial data arrives or changes
  useEffect(() => {
    if (initialFaqs.length > 0) {
      setLoadedPages(prev => ({
        ...prev,
        1: initialFaqs
      }));
    } else if (initialFaqs.length === 0 && !isLoading && !isFetching && isAuthenticated) {
      // Handle case where we get empty results (valid API response with no data)
      setLoadedPages(prev => ({
        ...prev,
        1: []
      }));
    }
  }, [initialFaqs, isLoading, isFetching, isAuthenticated]);

  // Preemptive loading: fetch next page when approaching end of current data (disabled during search)
  useEffect(() => {
    // Don't preload when there's an active search term or when data is still loading
    if (debouncedSearchTerm || isLoading || isFetching) {
      return;
    }

    const preloadNextPage = async () => {
      // Calculate total available items
      const allLoadedPages = Object.keys(loadedPages).sort((a, b) => parseInt(a) - parseInt(b));
      const totalItems = allLoadedPages.reduce((sum, page) => sum + loadedPages[parseInt(page)].length, 0);

      // Find the highest loaded page
      const maxLoadedPage = allLoadedPages.length > 0 ? Math.max(...allLoadedPages.map(p => parseInt(p))) : 0;

      // Check if we need to preload (when we have PRELOAD_THRESHOLD or fewer items remaining)
      const remainingItems = totalItems - (displayPage * DISPLAY_ITEMS);
      const nextPage = maxLoadedPage + 1;

      if (remainingItems <= PRELOAD_THRESHOLD && !loadingPages.has(nextPage) && !loadedPages[nextPage]) {
        setLoadingPages(prev => new Set([...prev, nextPage]));
        try {
          const nextPageData = await fetchPage(nextPage);
          if (nextPageData.length > 0) {
            setLoadedPages(prev => ({
              ...prev,
              [nextPage]: nextPageData
            }));
          }
        } catch (error) {
          console.error('Failed to preload page:', nextPage, error);
        } finally {
          setLoadingPages(prev => {
            const newSet = new Set(prev);
            newSet.delete(nextPage);
            return newSet;
          });
        }
      }
    };

    if (Object.keys(loadedPages).length > 0) {
      preloadNextPage();
    }
  }, [displayPage, loadedPages, loadingPages, debouncedSearchTerm, fetchPage, isLoading, isFetching]);

  // Clear loaded pages and reset pagination when search or department changes
  useEffect(() => {
    setLoadedPages({});
    setLoadingPages(new Set());
    setCurrentPage(1);
    setDisplayPage(1);
    // Also clear any pending search state
    if (debouncedSearchTerm === '') {
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, selectedDepartment]);

  // Handle component mount/remount - ensure we have proper initial state
  useEffect(() => {
    // Reset to initial state when component mounts and auth is ready
    if (!authLoading && isAuthenticated && Object.keys(loadedPages).length === 0) {
      // If we have no loaded pages but query is enabled, the query should run automatically
      // This effect mainly handles edge cases where state gets out of sync
      console.log('FAQ Page mounted - initial state reset');
    }
  }, [authLoading, isAuthenticated, loadedPages]);

  // Delete FAQ mutation
  const deleteFaqMutation = useMutation({
    mutationFn: async (faqId: string) => {
      return vkgApiService.deleteQuestion({
        knowledge_id: 'document_0',
        chunk_index: faqId,
      });
    },
    onSuccess: () => {
      // Clear loaded pages and refetch to get fresh data
      setLoadedPages({});
      setLoadingPages(new Set());
      setDisplayPage(1);
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({
        title: 'Success',
        description: 'FAQ deleted successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete FAQ:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to delete FAQ. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
    },
  });

  // Combine all loaded pages into a single array
  const allFaqs = React.useMemo(() => {
    const sortedPages = Object.keys(loadedPages).sort((a, b) => parseInt(a) - parseInt(b));
    return sortedPages.flatMap(page => loadedPages[parseInt(page)]);
  }, [loadedPages]);

  // Check if we're in a state where we should show data but don't have any
  const shouldHaveData = !authLoading && isAuthenticated && !isLoading && !isFetching;
  const hasNoLoadedData = Object.keys(loadedPages).length === 0;
  const needsDataRefresh = shouldHaveData && hasNoLoadedData && allFaqs.length === 0;

  // Calculate display items: show DISPLAY_ITEMS (10) items from combined data
  const displayStartIndex = (displayPage - 1) * DISPLAY_ITEMS;
  const displayEndIndex = displayStartIndex + DISPLAY_ITEMS;
  const currentFAQs = allFaqs.slice(displayStartIndex, displayEndIndex);

  // Calculate total display pages based on available data
  const totalDisplayPages = Math.ceil(allFaqs.length / DISPLAY_ITEMS) || 1;

  // Handle case where we need to refresh data when returning to page
  useEffect(() => {
    if (needsDataRefresh) {
      console.log('Detected need for data refresh, triggering refetch');
      refetch();
    }
  }, [needsDataRefresh, refetch]);

  const handleNewQuestion = () => {
    router.push('/faq/new');
  };

  const handleEdit = (id: string) => {
    router.push(`/faq/edit/${id}`);
  };

  const handleDelete = (faq: FAQItem) => {
    setFaqToDelete(faq);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!faqToDelete) return;
    setDeletingId(faqToDelete.id);
    deleteFaqMutation.mutate(faqToDelete.id);
  };

  const handlePageChange = (page: number) => {
    // Only allow navigation to pages we have data for
    if (page <= totalDisplayPages) {
      setDisplayPage(page);
    }
  };

  const handlePrevPage = () => {
    if (displayPage > 1) {
      setDisplayPage(prev => prev - 1);
    }
  };

  const handleNextPage = async () => {
    // If we have enough data for the next page, just navigate
    if (displayPage < totalDisplayPages) {
      setDisplayPage(prev => prev + 1);
      return;
    }

    // Don't load more pages during search to prevent excessive API calls
    if (debouncedSearchTerm) {
      return;
    }

    // If we're at the last page and there might be more data, try to load it
    const allLoadedPages = Object.keys(loadedPages).sort((a, b) => parseInt(a) - parseInt(b));
    const maxLoadedPage = allLoadedPages.length > 0 ? Math.max(...allLoadedPages.map(p => parseInt(p))) : 0;
    const nextApiPage = maxLoadedPage + 1;

    // Check if we're at the end of current data and need to load more
    if (!loadingPages.has(nextApiPage) && !loadedPages[nextApiPage]) {
      setLoadingPages(prev => new Set([...prev, nextApiPage]));
      try {
        const nextPageData = await fetchPage(nextApiPage);
        if (nextPageData.length > 0) {
          setLoadedPages(prev => ({
            ...prev,
            [nextApiPage]: nextPageData
          }));
          // Now that we have more data, we can navigate to the next display page
          setDisplayPage(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to load next page:', nextApiPage, error);
      } finally {
        setLoadingPages(prev => {
          const newSet = new Set(prev);
          newSet.delete(nextApiPage);
          return newSet;
        });
      }
    }
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="content-area flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please log in to access FAQs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area">
      <PageHeader
        title="Claire Knowledge Base"
        subtitle="Manage your FAQ questions and answers"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">All Questions</CardTitle>
            <Button onClick={handleNewQuestion} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
              )}
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isSearching ? 'pr-10' : ''}`}
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Question</TableHead>
                  <TableHead className="font-semibold">Answer</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Routing</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-red-600">
                        <p className="font-medium">Error loading FAQs</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {error instanceof Error ? error.message : 'Failed to load FAQs'}
                        </p>
                        <Button
                          onClick={() => refetch()}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isLoading || (isFetching && allFaqs.length === 0) || needsDataRefresh ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-gray-600">
                          {debouncedSearchTerm ? 'Searching FAQs...' : 'Loading FAQs...'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentFAQs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {debouncedSearchTerm 
                        ? `No FAQs found matching "${debouncedSearchTerm}".` 
                        : allFaqs.length === 0 
                        ? 'No FAQs found.' 
                        : 'No FAQs match your criteria.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentFAQs.map((faq) => (
                    <TableRow key={faq.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium max-w-xs">
                        {faq.question}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-gray-600 truncate">
                          {faq.answer}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          {faq.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={faq.routing_status ? "default" : "secondary"}>
                          {faq.routing_status ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(faq.id)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(faq)}
                            disabled={deleteFaqMutation.isPending && deletingId === faq.id}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            {deleteFaqMutation.isPending && deletingId === faq.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>
              Showing {allFaqs.length > 0 ? ((displayPage - 1) * DISPLAY_ITEMS) + 1 : 0}-{((displayPage - 1) * DISPLAY_ITEMS) + currentFAQs.length} of {allFaqs.length} FAQs
              {debouncedSearchTerm && (
                <span className="text-blue-600 ml-1">
                  (filtered by "{debouncedSearchTerm}")
                </span>
              )}
              <span className="ml-2">(Page {displayPage} of {totalDisplayPages})</span>
              {loadingPages.size > 0 && (
                <span className="ml-2 text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                  Loading more...
                </span>
              )}
              {isFetching && allFaqs.length > 0 && (
                <span className="ml-2 text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                  Updating...
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={displayPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalDisplayPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalDisplayPages - 4, displayPage - 2)) + i;
                if (pageNum > totalDisplayPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className={displayPage === pageNum ? "bg-blue-600 text-white" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={displayPage >= totalDisplayPages && loadingPages.size === 0}
              >
                {loadingPages.size > 0 && displayPage >= totalDisplayPages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
              <br />
              <strong>Question:</strong> {faqToDelete?.question}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
