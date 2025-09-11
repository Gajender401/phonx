import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { create } from 'zustand';
import { getCookie, setCookie } from 'cookies-next';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

// Type Definitions
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface DashboardStats {
  totalCalls: number;
  missedCalls: number;
  averageHandlingTime: number;
  satisfactionRate: number;
}

export interface CallsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface ClairePerformance {
  date: string;
  queriesSolvedPercentage: number;
  averageResponseTime: number;
  customerSatisfactionScore: number;
  totalCalls: number;
}

export interface BrandInfo {
  name: string;
  totalAgents: number;
  activeAgents: number;
  queueLength: number;
  averageWaitTime: number;
}

export interface Department {
  id: number;
  departmentName: string;
}

// Auth Store Interface
interface AuthStore {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
}

// Loading Store Interface
interface LoadingStore {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// Create stores
export const useAuthStore = create<AuthStore>((set: any) => ({
  token: typeof window !== 'undefined' ? (getCookie('token') as string) || null : null,
  isAuthenticated: typeof window !== 'undefined' ? !!getCookie('token') : false,
  setToken: (token: string | null) => {
    if (token) {
      setCookie('token', token, { maxAge: 60 * 60 * 24 * 7 }); // 7 days
      set({ token, isAuthenticated: true });
    } else {
    }
  },
}));

export const useLoadingStore = create<LoadingStore>((set: any) => ({
  isLoading: false,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
}));

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? getCookie('token') as string : null;
    const isAuthRoute = config.url?.includes('/auth'); // Don't block auth routes
    
    if (!token && !isAuthRoute) {
      // Reject the request if no token and not an auth route
      useLoadingStore.getState().setIsLoading(false);
      return Promise.reject(new Error('Authentication required'));
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    useLoadingStore.getState().setIsLoading(true);
    return config;
  },
  (error: any) => {
    useLoadingStore.getState().setIsLoading(false);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    useLoadingStore.getState().setIsLoading(false);
    return response;
  },
  (error: AxiosError) => {
    useLoadingStore.getState().setIsLoading(false);
    
    // If error is 401 Unauthorized, clear the token
    if (error.response?.status === 401) {
      useAuthStore.getState().setToken(null);
    }
    
    return Promise.reject(error);
  }
);

// Generic API wrapper functions
export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response: AxiosResponse<T> = await api.get(url);
    return response.data;
  },
  
  post: async <T>(url: string, data?: any): Promise<T> => {
    const response: AxiosResponse<T> = await api.post(url, data);
    return response.data;
  },
  
  put: async <T>(url: string, data?: any): Promise<T> => {
    const response: AxiosResponse<T> = await api.put(url, data);
    return response.data;
  },
  
  delete: async <T>(url: string): Promise<T> => {
    const response: AxiosResponse<T> = await api.delete(url);
    return response.data;
  },

  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response: AxiosResponse<T> = await api.patch(url, data);
    return response.data;
  }
};

// Staff API Types
export interface Schedule {
  id?: number;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  staffId?: number;
}

export interface Staff {
  id?: number;
  name: string;
  title: string;
  departmentId: number;
  department?: {
    id: number;
    departmentName: string;
  };
  ext: string;
  number: string;
  timezone: string;
  available: boolean;
  schedule: Schedule[];
}

export interface CreateStaffDto {
  name: string;
  title: string;
  departmentId: number;
  ext: string;
  number: string;
  timezone: string;
  available: boolean;
  schedule: Schedule[];
}

export interface UpdateStaffDto extends Partial<CreateStaffDto> {}

// Staff API Functions
export const staffApi = {
  getAllStaff: async (departmentId?: number): Promise<Staff[]> => {
    const url = departmentId ? `/staff?departmentId=${departmentId}` : '/staff';
    return apiClient.get<Staff[]>(url);
  },

  createStaff: async (staffData: Omit<Staff, 'id'>): Promise<Staff> => {
    return apiClient.post<Staff>('/staff', staffData);
  },

  updateStaff: async (id: number, staffData: Partial<Staff>): Promise<Staff> => {
    return apiClient.put<Staff>(`/staff/${id}`, staffData);
  },

  getStaffSchedule: async (id: number): Promise<Schedule[]> => {
    return apiClient.get<Schedule[]>(`/staff/${id}/schedule`);
  },

  updateStaffSchedule: async (id: number, scheduleData: Schedule[]): Promise<Schedule[]> => {
    return apiClient.put<Schedule[]>(`/staff/${id}/schedule`, scheduleData);
  }
};

// Missed Call Types
export interface MissedCall {
  id: number;
  time: string;
  date: string;
  department: string;
  phoneNumber: string;
  inquiry: string;
  status: 'unanswered' | 'answered';
}

export interface MissedCallsResponse {
  calls: MissedCall[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// Missed Call API Functions
export const missedCallsApi = {
  getMissedCalls: async (params?: {
    page?: number;
    pageSize?: number;
    date?: string;
    month?: string;
    departmentId?: string;
    status?: 'unanswered' | 'answered';
  }): Promise<ApiResponse<MissedCallsResponse>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiClient.get<ApiResponse<MissedCallsResponse>>(`/miss-calls?${queryParams.toString()}`);
  },

  markAsAnswered: async (id: number): Promise<ApiResponse<MissedCall>> => {
    return apiClient.patch<ApiResponse<MissedCall>>(`/miss-calls/${id}/status`, {
      status: 'answered'
    });
  },

  markAsUnanswered: async (id: number): Promise<ApiResponse<MissedCall>> => {
    return apiClient.patch<ApiResponse<MissedCall>>(`/miss-calls/${id}/status`, {
      status: 'unanswered'
    });
  }
};

// Complaint Types
export interface Complaint {
  id: number;
  time: string;
  date: string;
  brandName: string;
  department: string;
  complaintNumber: string;
  description: string;
  customerNumber: string;
  phoneNumber: string;
  audioUrl?: string;
  status?: string;
  remarks?: string;
  conversations?: {
    sender: string;
    transcript?: string;
    message?: string; // Keep for backward compatibility
    timestamp: string;
    status?: string;
  }[];
}

export interface ComplaintsResponse {
  complaints: Complaint[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// Complaints API Functions
export const complaintsApi = {
  getComplaints: async (params?: {
    page?: number;
    pageSize?: number;
    date?: string;
    month?: string;
    departmentId?: string;
    brandName?: string;
  }): Promise<ComplaintsResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiClient.get<ComplaintsResponse>(`/complaints?${queryParams.toString()}`);
  },

  getComplaintById: async (id: number): Promise<Complaint> => {
    return apiClient.get<Complaint>(`/complaints/${id}`);
  },

  updateComplaintRemarks: async (id: number, remarks: string): Promise<ApiResponse<Complaint>> => {
    return apiClient.patch<ApiResponse<Complaint>>(`/complaints/${id}/remarks`, { remarks });
  },

  respondToComplaint: async (id: number, response: string): Promise<ApiResponse<Complaint>> => {
    return apiClient.post<ApiResponse<Complaint>>(`/complaints/${id}/respond`, { response });
  }
};

// Knowledge Base Types
export interface KnowledgeBaseDocument {
  id: string;
  title: string;
  documentUrl: string;
  lastUpdated: Date;
  size: number;
  fileType: string;
  brandInfo: {
    brandName: string;
    companyName: string;
    ownerName: string;
  };
}

export interface KnowledgeBaseResponse {
  documents: KnowledgeBaseDocument[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Knowledge Base API Functions
export const knowledgeBaseApi = {
  getDocuments: async (brandId: string): Promise<KnowledgeBaseDocument[]> => {
    return apiClient.get<KnowledgeBaseDocument[]>(`/knowledge-base/documents/${brandId}`);
  },

  getAllDocuments: async (): Promise<KnowledgeBaseDocument[]> => {
    return apiClient.get<KnowledgeBaseDocument[]>(`/knowledge-base/admin/all-documents`);
  },

  getDocumentById: async (brandId: string, id: string): Promise<KnowledgeBaseDocument> => {
    return apiClient.get<KnowledgeBaseDocument>(`/knowledge-base/documents/${brandId}/${id}`);
  }
};

export default api;