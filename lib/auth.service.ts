import api from './axios';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RefreshTokenData {
  refreshToken: string;
  email: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = data.data;
    
    // Save accessToken in cookie with 1 day expiry
    setCookie('token', accessToken, { maxAge: 60 * 60 * 24 }); // 1 day in seconds
    
    // Save refreshToken in cookie with 30 days expiry
    setCookie('refreshToken', refreshToken, { maxAge: 60 * 60 * 24 * 30 }); // 30 days in seconds
    
    // Save user email for refresh token calls
    setCookie('userEmail', user.email, { maxAge: 60 * 60 * 24 * 30 }); // 30 days in seconds
    
    return { 
      token: accessToken, 
      refreshToken,
      user: { id: user.sub, email: user.email, name: user.name } 
    };
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async (): Promise<RefreshTokenResponse | null> => {
  try {
    const refreshToken = getCookie('refreshToken');
    const userEmail = getCookie('userEmail');
    
    if (!refreshToken || !userEmail) {
      return null;
    }

    const refreshData: RefreshTokenData = {
      refreshToken: refreshToken as string,
      email: userEmail as string,
    };

    const { data } = await api.post('/auth/refresh-token', refreshData);
    const { accessToken, refreshToken: newRefreshToken } = data.data;
    
    // Update access token cookie
    setCookie('token', accessToken, { maxAge: 60 * 60 * 24 }); // 1 day in seconds
    
    // Update refresh token if a new one was returned
    if (newRefreshToken) {
      setCookie('refreshToken', newRefreshToken, { maxAge: 60 * 60 * 24 * 30 }); // 30 days in seconds
    }
    
    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    // If refresh fails, clear all auth cookies
    deleteCookie('token');
    deleteCookie('refreshToken');
    deleteCookie('userEmail');
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint to invalidate tokens on server
    await api.post('/auth/logout');
  } catch (error) {
    // Even if server logout fails, clear local cookies
    console.error('Server logout failed:', error);
  } finally {
    // Clear all auth cookies
    deleteCookie('token');
    deleteCookie('refreshToken');
    deleteCookie('userEmail');
  }
};

export const getMe = async () => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (error) {
    throw error;
  }
}; 