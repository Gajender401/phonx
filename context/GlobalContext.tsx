'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getCookie } from 'cookies-next';
import { getMe, logout as authLogout } from '@/lib/auth.service';
import { ApiResponse, Department, apiClient } from '@/lib/api';

type UserRole = 'user' | 'admin';

interface Brand {
  id: string;
  brandName: string;
}

interface User {
  name: string;
  email: string;
  role: UserRole;
  brand?: Brand | Brand[];
}

interface MenuItem {
  icon: string;
  label: string;
  path: string;
}

export interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  currentMonth: string;
  currentWeek: number;
  isSidebarCollapsed: boolean;
  selectedBrandId: string | null;
  selectedBrand: Brand | null;
  brands: Brand[];
  departments: Department[] | null;
  departmentsLoading: boolean;
  departmentsError: string | null;
  fetchDepartments: () => Promise<void>;
  toggleSidebar: () => void;
  setCurrentMonth: (month: string) => void;
  setCurrentWeek: (week: number) => void;
  login: (userData: any) => void;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isUser: () => boolean;
  getMenuItems: () => MenuItem[];
  setSelectedBrandId: (brandId: string) => void;
  setSelectedBrand: (brand: Brand | null) => void;
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
  });
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>('all');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [departmentsLoading, setDepartmentsLoading] = useState<boolean>(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      setDepartmentsError(null);
      const departmentsResponse = await apiClient.get<ApiResponse<Department[]>>('/departments');
      setDepartments(departmentsResponse.data);
    } catch (err) {
      setDepartmentsError(err instanceof Error ? err.message : 'Failed to fetch departments data');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  React.useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      const token = getCookie('token');
      
      if (token) {
        try {
          const userData = await getMe();
          // Map backend role to frontend UserRole
          const mappedRole = userData.role === 'ADMIN' ? 'admin' : 'user';
          
          // Handle brand data
          let brandData: Brand[] = [];
          if (userData.brand) {
            if (Array.isArray(userData.brand)) {
              // Admin case: multiple brands
              brandData = userData.brand;
              setBrands(userData.brand);
              // Default to 'All Brands' selection on load
              setSelectedBrandId('all');
            } else {
              // User case: single brand
              brandData = [userData.brand];
              setBrands([userData.brand]);
              // Default to 'All Brands' selection on load
              setSelectedBrandId('all');
            }
          }

          setUser({
            name: userData.name,
            email: userData.email,
            role: mappedRole,
            brand: userData.brand,
          });
          setIsAuthenticated(true);
          
          // Fetch departments after successful auth
          await fetchDepartments();
        } catch (error) {
          // If error, logout (clear user and isAuthenticated)
          setUser(null);
          setIsAuthenticated(false);
          setBrands([]);
          setSelectedBrandId(null);
        }
      } else {
        // No token found
        setUser(null);
        setIsAuthenticated(false);
        setBrands([]);
        setSelectedBrandId(null);
      }
      
      setAuthLoading(false);
    };

    initializeAuth();
  }, []);

  // Add effect to update selectedBrand when selectedBrandId changes
  React.useEffect(() => {
    if (selectedBrandId && selectedBrandId !== 'all' && brands.length > 0) {
      const brand = brands.find(b => b.id === selectedBrandId);
      setSelectedBrand(brand || null);
    } else {
      setSelectedBrand(null);
    }
  }, [selectedBrandId, brands]);

  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return [
        { icon: 'Home', label: 'Dashboard', path: '/' },
        { icon: 'PhoneCall', label: 'Escalated Calls', path: '/complaints' },
        { icon: 'History', label: 'History', path: '/history' },
        { icon: 'Users', label: 'Staff', path: '/staff' },
        { icon: 'Bot', label: 'Phonx', path: '/faq' },
        { icon: 'Settings', label: 'Settings', path: '/settings' }
      ];
    }
    // Default user menu items
    return [
      { icon: 'Home', label: 'Dashboard', path: '/' },
      { icon: 'PhoneCall', label: 'Escalated Calls', path: '/complaints' },
      { icon: 'History', label: 'History', path: '/history' },
      { icon: 'Users', label: 'Staff', path: '/staff' },
      { icon: 'Bot', label: 'Phonx', path: '/faq' },
      { icon: 'Settings', label: 'Settings', path: '/settings' }
    ];
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const login = (userData: any) => {
    // Map backend role to frontend UserRole
    const mappedRole = userData.role === 'ADMIN' ? 'admin' : 'user';
    
    // Handle brand data
    if (userData.brand) {
      if (Array.isArray(userData.brand)) {
        // Admin case: multiple brands
        setBrands(userData.brand);
        // Default to 'All Brands' selection on login
        setSelectedBrandId('all');
      } else {
        // User case: single brand
        setBrands([userData.brand]);
        // Default to 'All Brands' selection on login
        setSelectedBrandId('all');
      }
    }

    setUser({
      name: userData.name,
      email: userData.email,
      role: mappedRole,
      brand: userData.brand,
    });
    setIsAuthenticated(true);
    
    // Fetch departments after login
    fetchDepartments();
  };

  const logout = async () => {
    try {
      // Call the auth service logout which handles server logout and cookie cleanup
      await authLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local state regardless of server response
      setUser(null);
      setIsAuthenticated(false);
      setBrands([]);
      setSelectedBrandId(null);
      setDepartments(null);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isUser = () => {
    return user?.role === 'user';
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        authLoading,
        currentMonth,
        currentWeek,
        isSidebarCollapsed,
        selectedBrandId,
        selectedBrand,
        brands,
        departments,
        departmentsLoading,
        departmentsError,
        fetchDepartments,
        toggleSidebar,
        setCurrentMonth,
        setCurrentWeek,
        login,
        logout,
        isAdmin,
        isUser,
        getMenuItems,
        setSelectedBrandId,
        setSelectedBrand,
        selectedDepartment,
        setSelectedDepartment
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
