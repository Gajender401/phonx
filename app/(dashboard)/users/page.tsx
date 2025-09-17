'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { Building, Mail, User, Search, UserPlus, CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from '@/lib/api';
import { useApp } from '@/context/GlobalContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const userFormSchema = z.object({
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companySize: z.string().min(1, 'Company size is required'),
  companyAddress: z.string().min(5, 'Company address must be at least 5 characters'),
  companyNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(14, 'Phone number is too long')
    .regex(/^[\d\s\-\(\)\.]+$/, 'Phone number contains invalid characters')
    .refine((val) => {
      // Remove all non-digit characters to count digits
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length === 10;
    }, 'Phone number must be exactly 10 digits (US format)'),
  companyEmail: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const otpFormSchema = z.object({
  otp: z.string().min(6, 'OTP must be at least 6 characters'),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type OtpFormValues = z.infer<typeof otpFormSchema>;

interface User {
  id: string;
  ownerName: string;
  companyName: string;
  companySize: string;
  companyAddress: string;
  companyNumber: string;
  companyEmail: string;
  brandId: string;
  isVerified: boolean;
}

interface PaginatedResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Simple debounce function
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Format US phone number for display
const formatUSPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 1 (US country code), remove it for formatting
  const localNumber = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
  
  // Format as (XXX) XXX-XXXX
  if (localNumber.length === 10) {
    return `(${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
  }
  
  return phoneNumber;
};

// Ensure phone number has +1 prefix
const ensureUSPhoneFormat = (phoneNumber: string) => {
  if (!phoneNumber) return '';
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  return phoneNumber.startsWith('+1') ? phoneNumber : `+1${digits}`;
};

export default function Users() {
  const { isAuthenticated, authLoading } = useApp();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<UserFormValues | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      ownerName: '',
      companyName: '',
      companySize: '',
      companyAddress: '',
      companyNumber: '',
      companyEmail: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: '',
    },
  });

  const passwordValue = form.watch('password');
  const confirmPasswordValue = form.watch('confirmPassword');
  const passwordsMismatch = Boolean(confirmPasswordValue) && passwordValue !== confirmPasswordValue;

  // Fetch users using React Query with pagination
  const { data: paginatedData, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['users', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      let url = '/users';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      url += `?${params.toString()}`;
      const res = await apiClient.get<{data: any[], total?: number, page?: number, limit?: number}>(url);
      
      // Transform the data to match our interface
      const transformedData = res.data.map((u: any) => ({
        id: u.id,
        ownerName: u.ownerName,
        companyName: u.brandName ?? '', // Backend returns brandName, map it to companyName for frontend
        companySize: String(u.companySize ?? ''),
        companyAddress: u.companyAddress,
        companyNumber: u.phoneNumber ?? '',
        companyEmail: u.companyEmailAddress ?? '',
        brandId: u.brandName ?? '',
        isVerified: u.isVerified ?? false,
      }));
      
      // Calculate total pages
      const total = res.total || transformedData.length;
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        data: transformedData,
        total,
        page: currentPage,
        limit: pageSize,
        totalPages,
      };
    },
    enabled: !authLoading && isAuthenticated,
  });

  const users = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;
  const total = paginatedData?.total || 0;

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: Omit<UserFormValues, 'confirmPassword' | 'companyName'> & { brandName: string }) => 
      apiClient.post<{ status: string; data: { brand: any } }>('/users', userData),
    onSuccess: (res) => {
      const newUser = {
        id: res.data.brand.id,
        ownerName: res.data.brand.ownerName,
        companyName: res.data.brand.brandName ?? '', // Backend returns brandName, map it to companyName for frontend
        companySize: String(res.data.brand.companySize ?? ''),
        companyAddress: res.data.brand.companyAddress,
        companyNumber: res.data.brand.phoneNumber ?? '',
        companyEmail: res.data.brand.companyEmailAddress ?? '',
        brandId: res.data.brand.brandName ?? '',
        isVerified: false,
      };
      
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast({
        title: 'Success!',
        description: 'User registration completed successfully.',
      });
      setShowConfirmation(false);
      setFormData(null);
      setIsModalOpen(false);
      // Open OTP verification modal for the new user
      setSelectedUser(newUser);
      setIsOtpModalOpen(true);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  // Resend OTP mutation
  const resendOtpMutation = useMutation({
    mutationFn: (email: string) => apiClient.post(`/auth/resend-otp/${email}`),
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'OTP has been resent to your email.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to resend OTP',
        variant: 'destructive',
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: (data: { email: string; code: string }) => 
      apiClient.post('/auth/otp-verify', data),
    onSuccess: () => {
      if (selectedUser) {
        // Invalidate and refetch users query
        queryClient.invalidateQueries({ queryKey: ['users'] });
        
        toast({
          title: 'Success!',
          description: 'User verified successfully.',
        });
        
        setIsOtpModalOpen(false);
        otpForm.reset();
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Invalid OTP',
        variant: 'destructive',
      });
    },
  });

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setCurrentPage(1); // Reset to first page when searching
    }, 400),
    []
  );

  useEffect(() => {
    if (!isModalOpen) {
      form.reset();
      setShowConfirmation(false);
      setFormData(null);
    }
  }, [isModalOpen, form]);

  useEffect(() => {
    debouncedSearch(searchInput);
  }, [searchInput, debouncedSearch]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const onSubmit = (data: UserFormValues) => {
    setFormData(data);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (formData) {
      const { password, confirmPassword, companyName, ...userData } = formData;
      // Format phone number with +1 prefix for US numbers
      const formattedPhoneNumber = ensureUSPhoneFormat(userData.companyNumber);
      const payload = { 
        ...userData, 
        brandName: companyName, // Send companyName as brandName to API
        password,
        companyNumber: formattedPhoneNumber
      };
      createUserMutation.mutate(payload);
    }
  };

  const handleEdit = () => {
    setShowConfirmation(false);
  };

  const handleVerifyClick = (user: User) => {
    setSelectedUser(user);
    setIsOtpModalOpen(true);
  };

  const handleResendOtp = () => {
    if (selectedUser) {
      resendOtpMutation.mutate(selectedUser.companyEmail);
    }
  };

  const handleVerifyOtp = (data: OtpFormValues) => {
    if (selectedUser) {
      verifyOtpMutation.mutate({
        email: selectedUser.companyEmail,
        code: data.otp,
      });
    }
  };

  // Memoize the RegistrationForm component
  const RegistrationForm = React.useMemo(() => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner Name</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                      <User size={16} className="text-gray-500" />
                    </div>
                    <Input className="rounded-l-none" placeholder="John Doe" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                      <Building size={16} className="text-gray-500" />
                    </div>
                    <Input className="rounded-l-none" placeholder="Acme Corporation" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 50-100 " {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Number (US)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(555) 123-4567" 
                      {...field}
                      onChange={(e) => {
                        // Format the input as user types
                        const formatted = formatUSPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="companyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Business Street, City, State, ZIP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Email</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                      <Mail size={16} className="text-gray-500" />
                    </div>
                    <Input className="rounded-l-none" placeholder="contact@company.com" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="********"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  {passwordsMismatch && (
                    <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
                  )}
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
          Register
        </Button>
      </form>
    </Form>
  ), [form, showPassword, showConfirmPassword, passwordsMismatch]);

  // Memoize the confirmation dialog
  const ConfirmationDialog = React.useMemo(() => {
    if (!formData) return null;
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-600">Owner Name</h3>
              <p>{formData.ownerName}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-600">Company Name</h3>
              <p>{formData.companyName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-600">Company Size</h3>
              <p>{formData.companySize}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-600">Company Number</h3>
              <p>{ensureUSPhoneFormat(formData.companyNumber)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-600">Company Address</h3>
            <p>{formData.companyAddress}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-600">Company Email</h3>
            <p>{formData.companyEmail}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleEdit}
            className="flex-1"
          >
            Edit Information
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? 'Processing...' : 'Confirm & Submit'}
          </Button>
        </div>
      </div>
    );
  }, [formData, createUserMutation.isPending]);

  // OTP Verification Dialog
  const OtpVerificationDialog = React.useMemo(() => (
    <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle>Verify User</DialogTitle>
        </DialogHeader>
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-6">
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter OTP</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter OTP code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOtp}
                className="flex-1"
              >
                Resend OTP
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Verify
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  ), [isOtpModalOpen, otpForm]);

  // Pagination component
  const PaginationControls = React.useMemo(() => {
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={currentPage === pageNum ? "bg-primary hover:bg-primary/90" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  }, [currentPage, pageSize, total, totalPages]);

  return (
    <>
      <GlobalHeader />
      <div className="content-area px-4 md:px-6 lg:px-8 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-textColor">
                  Users
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  Manage user accounts and verification
                </p>
              </div>
            </div>

            {/* Search and Add User */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative w-64">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                  }}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              </div>

              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus size={16} className="mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        <Card className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-8">{error.message}</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Owner Name</TableHead>
                    <TableHead className="whitespace-nowrap">Company Name</TableHead>
                    <TableHead className="whitespace-nowrap">Company Size</TableHead>
                    <TableHead className="whitespace-nowrap">Company Email</TableHead>
                    <TableHead className="whitespace-nowrap">Company Number</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="whitespace-nowrap">{user.ownerName}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.companyName}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.companySize}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.companyEmail}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {ensureUSPhoneFormat(user.companyNumber)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {user.isVerified ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle size={16} className="mr-1" />
                              Verified
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <XCircle size={16} className="mr-1" />
                              Unverified
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {!user.isVerified && (
                            <Button
                              onClick={() => handleVerifyClick(user)}
                              variant="outline"
                              size="sm"
                              className="text-primary border-primary"
                            >
                              Verify Now
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {users.length > 0 && PaginationControls}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{showConfirmation ? "Confirm Information" : "Add New User"}</DialogTitle>
          </DialogHeader>

          {showConfirmation ? ConfirmationDialog : RegistrationForm}
        </DialogContent>
      </Dialog>

      {OtpVerificationDialog}
    </>
  );
}