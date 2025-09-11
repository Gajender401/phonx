/**
 * API Index for Dashboard
 * This file serves as a central registry of all API endpoints used in the application
 */

export const API_ENDPOINTS = {
  // Dashboard Related Endpoints
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    CALLS: '/api/dashboard/calls',
    MISSED_CALLS: '/api/dashboard/missed-calls',
    CLAIRE_PERFORMANCE: '/api/dashboard/claire-performance',
    BRAND_INFO: '/api/dashboard/brand-info',
    DEPARTMENTS: '/api/departments',
  },
  
  // Authentication Related Endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // Staff Related Endpoints
  STAFF: {
    LIST: '/api/staff',
    DETAILS: (id: string) => `/api/staff/${id}`,
    CREATE: '/api/staff',
    UPDATE: (id: string) => `/api/staff/${id}`,
    DELETE: (id: string) => `/api/staff/${id}`,
  },
} as const;

// Type for API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Dashboard Types
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
  accuracy: number;
  responseTime: number;
  successRate: number;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
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
  brandId: string;
  createdAt: string;
} 