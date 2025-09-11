"use client"
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { complaintsApi, type Complaint } from '@/lib/api';
import { useApp } from '@/context/GlobalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'remarked':
      return 'bg-green-100 text-green-700';
    case 'resolved':
      return 'bg-blue-100 text-blue-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'in-progress':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const ComplaintsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, authLoading, currentMonth } = useApp();
  
  // Derive YYYY-MM from context month string like 'August 2025'
  const deriveMonthParam = (monthLabel: string): string => {
    if (!monthLabel) return '';
    const [monthName, year] = monthLabel.split(' ');
    if (!monthName || !year) return '';
    const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
    return `${year}-${monthNumber.toString().padStart(2, '0')}`;
  };
  const initialMonthParam = deriveMonthParam(currentMonth);
  const [filters, setFilters] = useState({
    month: initialMonthParam,
    departmentId: '',
    brandName: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch complaints using React Query
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['complaints', filters, pagination.page, pagination.pageSize],
    queryFn: () => complaintsApi.getComplaints({
      page: pagination.page,
      pageSize: pagination.pageSize,
      month: filters.month,
      departmentId: filters.departmentId,
      brandName: filters.brandName,
    }),
    enabled: !authLoading && isAuthenticated,
  });

  // Mutation for updating remarks
  const updateRemarksMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks: string }) =>
      complaintsApi.updateComplaintRemarks(id, remarks),
    onSuccess: () => {
      toast.success('Remarks added successfully');
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setIsDialogOpen(false);
      setRemarks('');
      setSelectedComplaint(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add remarks');
    },
  });

  // Update pagination when data changes
  React.useEffect(() => {
    if (complaintsData?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: complaintsData.pagination.total,
      }));
    }
  }, [complaintsData]);

  const handleCardClick = (complaintId: number, e: React.MouseEvent) => {
    router.push(`/complaints/${complaintId}`);
  };

  const handleFilterChange = (type: 'month' | 'departmentId' | 'brandName', value: string) => {
    const nextValue = type === 'month' ? deriveMonthParam(value) : value;
    setFilters(prev => ({
      ...prev,
      [type]: nextValue,
    }));
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleAddRemarks = (complaint: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedComplaint(complaint);
    setRemarks(complaint.remarks || '');
    setIsDialogOpen(true);
  };

  const handleSubmitRemarks = () => {
    if (!selectedComplaint || !remarks.trim()) {
      toast.error('Please enter remarks');
      return;
    }
    updateRemarksMutation.mutate({
      id: selectedComplaint.id,
      remarks: remarks.trim(),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="content-area h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please log in to access complaints.</p>
        </div>
      </div>
    );
  }

  const complaints = complaintsData?.complaints || [];

  return (
    <div className="content-area h-screen flex flex-col overflow-hidden">
      <div className="flex-none">
        <Header 
          title="Complaints" 
          showMonthFilter={true} 
          showDepartmentFilter={true}
          showBrandFilterIntegrated={true}
          onMonthChange={(month) => handleFilterChange('month', month)}
          onDepartmentChange={(dept) => handleFilterChange('departmentId', dept)}
          onBrandChange={(brand) => handleFilterChange('brandName', brand)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-gray-500">Loading complaints...</p>
            </div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <p className="mt-2 text-gray-500">No complaints found for the selected month.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {complaints.map(complaint => (
              <Card 
                key={complaint.id}
                className="p-5 component-shadow card-radius bg-white transition-all duration-300 cursor-pointer hover:bg-gray-50"
                onClick={(e) => handleCardClick(complaint.id, e)}
              >
                <div className="flex flex-row justify-between gap-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between flex-1">
                    <div className="flex-1">
                      <div className="flex flex-row gap-3 items-center mb-3 flex-wrap">
                        <span className="font-medium">{complaint.brandName}</span>
                        <span className="text-sm text-gray-500">
                          {complaint.time} - {complaint.date}
                        </span>
                        <Badge className={`text-xs ${getDepartmentColor(complaint.department)}`}>
                          {complaint.department}
                        </Badge>
                        {complaint.status && (
                          <Badge className={`text-xs ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Customer Number: {complaint.customerNumber}</p>
                        <p className="text-sm font-semibold mb-1">Complaint Message:</p>
                        <p className="text-xs text-gray-600 mb-2">
                          {complaint.description}
                        </p>
                        {complaint.remarks && (
                          <div className="mt-3 p-2 bg-blue-50 rounded-md">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Remarks:</p>
                            <p className="text-xs text-blue-600">{complaint.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col justify-between items-end gap-2'>
                    <h3 className="font-medium text-gray-600">#{complaint.complaintNumber}</h3>
                    {/* <Button
                      size="sm"
                      variant={complaint.remarks ? "outline" : "default"}
                      onClick={(e) => handleAddRemarks(complaint, e)}
                      className="text-xs"
                    >
                      {complaint.remarks ? (
                        <>
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit Remarks
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Add Remarks
                        </>
                      )}
                    </Button> */}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Remarks Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {selectedComplaint?.remarks ? 'Edit Remarks' : 'Add Remarks'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Complaint: #{selectedComplaint?.complaintNumber}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {selectedComplaint?.description}
              </p>
            </div>
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <Textarea
                id="remarks"
                placeholder="Enter your remarks about this complaint..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={updateRemarksMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRemarks}
                disabled={updateRemarksMutation.isPending || !remarks.trim()}
              >
                {updateRemarksMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {selectedComplaint?.remarks ? 'Update Remarks' : 'Add Remarks'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintsPage;
