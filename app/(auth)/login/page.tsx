'use client'
import { useState, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { EyeOff, Eye, Loader2, Sun, Moon, Lock, Unlock } from 'lucide-react';
import { login, getMe } from '@/lib/auth.service';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useApp } from '@/context/GlobalContext';

function LoginForm({ isDarkMode, toggleTheme }: { isDarkMode: boolean; toggleTheme: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login: contextLogin } = useApp();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    // Client-side validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await login({ email, password });
      const userData = await getMe();
      contextLogin(userData);
      toast.success('Login successful');
      
      // Get the callback URL from search params or default to dashboard
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      router.push(callbackUrl);
    } catch (error: any) {
      // More specific error handling
      const errorMessage = error.response?.data?.message;
      
      if (errorMessage?.toLowerCase().includes('password')) {
        toast.error('Incorrect password. Please try again.');
      } else if (errorMessage?.toLowerCase().includes('email') || errorMessage?.toLowerCase().includes('user')) {
        toast.error('User not found. Please check your email address.');
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(errorMessage || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && email && password) {
      handleLogin();
    }
  };

  const handlePasswordReset = () => {
    router.push('/reset-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Layer SVG Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/layer.svg"
          alt="Background Layer"
          className="w-full h-full object-cover"
        />
      </div>


      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 border border-white/20 dark:border-white/10 rounded-[13px]"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5 text-blue-400" />
          )}
        </Button>
      </div>

      <Card className="w-full max-w-md bg-transparent border-0 shadow-none relative z-10" style={{background: 'linear-gradient(to bottom, transparent 0%, transparent 40%, #CB3CFF4D 100%)'}}>
        <CardHeader className="text-center pb-6">
          <div className="flex flex-col items-center space-y-4">
            <img src="/logo.svg" alt="Claire Logo" className="h-12 w-auto" />
            <h1 className="text-gray-900 dark:text-white text-5xl font-bold">Welcome</h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-normal">Welcome back! Please enter your details.</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-5" onKeyDown={handleKeyDown}>
            <div>
              <label htmlFor="email" className="block text-gray-900 dark:text-white text-sm font-medium mb-2">
                Email
              </label>
              <Input
                type="email"
                id="email"
                placeholder="Enter your email"
                className="bg-[#9CA3AF33] h-12 border-0 text-gray-900 dark:text-[#F3F3F3] placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-[13px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="block text-gray-900 dark:text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  className="bg-[#9CA3AF33] h-12 border-0 text-gray-900 dark:text-[#F3F3F3] placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-[13px] pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-[8px] hover:bg-white/10 dark:hover:bg-black/10"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <Unlock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </Button>
              </div>
              <div className="flex justify-end mt-1">
                <Button
                  variant="link"
                  className="text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white p-0 h-auto text-sm"
                  onClick={handlePasswordReset}
                  disabled={isLoading}
                >
                  Forgot Password?
                </Button>
              </div>
            </div>

          </div>
            <Button
              onClick={handleLogin}
              className="w-full bg-[#A871E1] my-10 py-4 hover:bg-[#9B63D1] text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black rounded-[13px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Login'
              )}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginComponent() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center relative">
        {/* Layer SVG Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/layer.svg"
            alt="Background Layer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Claire Logo" />
          </div>
        </div>

        {/* Theme Toggle Button */}
        <div className="absolute top-6 right-6 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 border border-white/20 dark:border-white/10 rounded-[13px]"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-blue-400" />
            )}
          </Button>
        </div>
        <Card className="w-full max-w-md bg-transparent border-0 shadow-none relative z-10">
          <CardHeader className="text-center pb-6">
            <div className="flex flex-col items-center space-y-4">
              <img src="/logo.svg" alt="Claire Logo" className="h-12 w-auto" />
              <h1 className="text-gray-900 dark:text-white text-5xl font-bold">Welcome</h1>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-normal">Welcome back! Please enter your details.</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-900 dark:text-white" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    </Suspense>
  );
}