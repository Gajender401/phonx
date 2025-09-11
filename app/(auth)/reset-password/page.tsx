'use client'
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { EyeOff, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { initiatePasswordResetPublic, confirmPasswordResetPublic } from '@/lib/settings.service';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ResetPasswordComponent() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Request reset code
  const [email, setEmail] = useState('');
  
  // Step 2: Confirm reset with code and new password
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handleRequestReset = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      const result = await initiatePasswordResetPublic({ email });
      toast.success(result.message || 'Password reset code sent to your email');
      setStep('confirm');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      toast.error(errorMessage || 'Failed to send password reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!code || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordsMatch(false);
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const result = await confirmPasswordResetPublic({
        email,
        code,
        newPassword
      });
      toast.success(result.message || 'Password reset successful');
      router.push('/login');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage?.toLowerCase().includes('code')) {
        toast.error('Invalid or expired verification code');
      } else {
        toast.error(errorMessage || 'Failed to reset password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordsMatch(value === newPassword || value === '');
  };

  const handleBackToRequest = () => {
    setStep('request');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordsMatch(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (step === 'request' && email) {
        handleRequestReset();
      } else if (step === 'confirm' && code && newPassword && confirmPassword) {
        handleConfirmReset();
      }
    }
  };

  return (
    <div 
      style={{
        background: 'linear-gradient(to bottom right, #111111 0%, #111111 60%, #DCE1E8 100%)',
      }} 
      className="min-h-screen flex items-center justify-center"
    >
      <div className="absolute top-6 left-6">
        <div className="flex items-center">
          <img src="/logo.svg" alt="Claire Logo" />
        </div>
      </div>
      
      <Card className="w-full max-w-md bg-transparent border-0 shadow-none">
        <CardHeader className="text-center pb-6">
          <h1 className="text-white text-4xl font-bold">
            {step === 'request' ? 'Reset Password' : 'Enter Reset Code'}
          </h1>
          {step === 'confirm' && (
            <p className="text-white/70 text-sm mt-2">
              Enter the verification code sent to {email}
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4" onKeyDown={handleKeyDown}>
            {step === 'request' ? (
              // Step 1: Request reset code
              <>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    className="bg-[#111111] border border-gray-700 text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  onClick={handleRequestReset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </>
            ) : (
              // Step 2: Confirm reset with code and new password
              <>
                <div>
                  <Input
                    type="text"
                    placeholder="Verification Code"
                    className="bg-[#111111] border border-gray-700 text-white"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    className="bg-[#111111] border border-gray-700 text-white"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>
                
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    className={`bg-[#111111] border text-white ${
                      passwordsMatch ? 'border-gray-700' : 'border-red-500'
                    }`}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>
                
                {!passwordsMatch && (
                  <p className="text-red-500 text-sm">Passwords do not match</p>
                )}
                
                <Button 
                  onClick={handleConfirmReset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
                
                <Button 
                  onClick={handleBackToRequest}
                  variant="outline"
                  className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Email Entry
                </Button>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-2">
          <Button 
            variant="link" 
            className="text-white/70 hover:text-white"
            onClick={() => router.push('/login')}
            disabled={isLoading}
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}