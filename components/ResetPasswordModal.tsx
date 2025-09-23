'use client'
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { initiatePasswordReset, confirmPasswordReset } from '@/lib/settings.service';
import { toast } from '@/components/ui/use-toast';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ 
  isOpen, 
  onClose, 
  userEmail 
}) => {
  // Password reset states
  const [passwordResetStep, setPasswordResetStep] = useState<'request' | 'confirm'>('request');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handlePasswordResetRequest = async () => {
    try {
      setIsResettingPassword(true);
      const result = await initiatePasswordReset();
      toast({
        title: "Success",
        description: result.message
      });
      setPasswordResetStep('confirm');
    } catch (error) {
      console.error('Error initiating password reset:', error);
      toast({
        title: "Error",
        description: "Failed to initiate password reset",
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handlePasswordResetConfirm = async () => {
    if (!resetCode || !newPassword || !confirmNewPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordsMatch(false);
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsResettingPassword(true);
      const result = await confirmPasswordReset({
        code: resetCode,
        newPassword: newPassword
      });
      toast({
        title: "Success",
        description: result.message
      });
      // Reset all password reset states and close modal
      resetModal();
      onClose();
    } catch (error: any) {
      console.error('Error confirming password reset:', error);
      const errorMessage = error.response?.data?.message;
      if (errorMessage?.toLowerCase().includes('code')) {
        toast({
          title: "Error",
          description: "Invalid or expired verification code",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage || "Failed to reset password",
          variant: "destructive"
        });
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmNewPassword(value);
    setPasswordsMatch(value === newPassword || value === '');
  };

  const resetModal = () => {
    setPasswordResetStep('request');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordsMatch(true);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-gradient-to-b from-[#1E1E1E] via-[#1E1E1E] to-[#9653DB69] border-none py-16 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Reset Password?
          </DialogTitle>
        </DialogHeader>

        {passwordResetStep === 'request' && (
          <div className="space-y-8">
            <p className="text-sm text-gray-300 text-center">
              A verification code will be sent to your registered email address: <strong>{userEmail}</strong>
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handlePasswordResetRequest}
                disabled={isResettingPassword}
                className=" bg-white w-full"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </div>
          </div>
        )}

        {passwordResetStep === 'confirm' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300 text-center">
              Enter the verification code sent to <strong>{userEmail}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Verification Code</label>
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  disabled={isResettingPassword}
                  className="bg-[#FFFFFF0F] border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-white">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isResettingPassword}
                    className="bg-[#FFFFFF0F] border-gray-600 text-white placeholder-gray-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isResettingPassword}
                  >
                    {showNewPassword ? (
                      <EyeOff size={16} className="text-gray-400" />
                    ) : (
                      <Eye size={16} className="text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-white">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={isResettingPassword}
                    className={`bg-[#FFFFFF0F] border-gray-600 text-white placeholder-gray-400 pr-10 ${!passwordsMatch ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isResettingPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} className="text-gray-400" />
                    ) : (
                      <Eye size={16} className="text-gray-400" />
                    )}
                  </Button>
                </div>
                {!passwordsMatch && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handlePasswordResetConfirm}
                disabled={isResettingPassword || !passwordsMatch}
                className="bg-[#7C3AED] hover:bg-[#7C3AED]/90 flex-1"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
