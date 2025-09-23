'use client'
import React, { useState, useEffect } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, Building, Lock, Save, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { getAccountDetails, updateAccountDetails, initiatePasswordReset, confirmPasswordReset, AccountDetails } from '@/lib/settings.service';
import { toast } from '@/components/ui/use-toast';
import { useApp } from '@/context/GlobalContext';

const Settings = () => {
  const { isAuthenticated, authLoading } = useApp();
  const [accountData, setAccountData] = useState<AccountDetails>({
    companyName: '',
    adminName: '',
    email: '',
    phoneNumber: '',
    companySize: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password reset states
  const [passwordResetStep, setPasswordResetStep] = useState<'idle' | 'request' | 'confirm'>('idle');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadAccountDetails();
    }
  }, [authLoading, isAuthenticated]);

  const loadAccountDetails = async () => {
    try {
      setIsLoading(true);
      const data = await getAccountDetails();
      setAccountData(data);
    } catch (error) {
      console.error('Error loading account details:', error);
      toast({
        title: "Error",
        description: "Failed to load account details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof AccountDetails, value: string) => {
    setAccountData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedData = await updateAccountDetails(accountData);
      setAccountData(updatedData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Account details updated successfully"
      });
    } catch (error) {
      console.error('Error updating account details:', error);
      toast({
        title: "Error",
        description: "Failed to update account details",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

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
      // Reset all password reset states
      setPasswordResetStep('idle');
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordsMatch(true);
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

  const cancelPasswordReset = () => {
    setPasswordResetStep('idle');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordsMatch(true);
  };

  if (isLoading) {
    return (
      <div className="content-area">
        <GlobalHeader title="Settings" />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading account details...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GlobalHeader title="Settings" />
      <div className="content-area">
        <div className="">
            {/* Header with Edit Details title and buttons */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-white">Edit Details</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 bg-transparent border-[#9653DB5E] text-white hover:bg-gray-600"
                >
                  <img src="/icons/pencile-active.svg" alt="Edit" className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setPasswordResetStep('request')}
                  className="bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white"
                >
                  Reset Password
                </Button>
              </div>
            </div>

            {/* Password Reset Modal Content */}
            {passwordResetStep !== 'idle' && (
              <div className="mb-6 p-4 bg-[#FFFFFF0F] w-[550px] rounded-lg">
                {passwordResetStep === 'request' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-white">Reset Password</h4>
                      <Button variant="ghost" size="sm" onClick={cancelPasswordReset}>
                        <ArrowLeft size={16} />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-300">
                      A verification code will be sent to your registered email address: <strong>{accountData.email}</strong>
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handlePasswordResetRequest}
                        disabled={isResettingPassword}
                        className="bg-[#7C3AED] hover:bg-[#7C3AED]/90"
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
                      <Button variant="outline" onClick={cancelPasswordReset}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {passwordResetStep === 'confirm' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-white">Enter Verification Code</h4>
                      <Button variant="ghost" size="sm" onClick={cancelPasswordReset}>
                        <ArrowLeft size={16} />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-300">
                      Enter the verification code sent to <strong>{accountData.email}</strong>
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
                          className="bg-[#FFFFFF0F] w-[550px] border-gray-600 text-white placeholder-gray-400"
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
                            className="bg-[#FFFFFF0F] w-[550px] border-gray-600 text-white placeholder-gray-400"
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
                            className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 text-white placeholder-gray-400 ${!passwordsMatch ? "border-red-500" : ""}`}
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
                        className="bg-[#7C3AED] hover:bg-[#7C3AED]/90"
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
                      <Button variant="outline" onClick={cancelPasswordReset}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block text-white">Admin Name</label>
                <Input
                  type="text"
                  value={accountData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  readOnly={!isEditing}
                  className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 text-white placeholder-gray-400 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  placeholder="Diego Matos"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-white">Company Name</label>
                <Input
                  type="text"
                  value={accountData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  readOnly={!isEditing}
                  className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 text-white placeholder-gray-400 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  placeholder="XYZ"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-white">Company Size</label>
                <Input
                  type="text"
                  value={accountData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  readOnly={!isEditing}
                  className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 text-white placeholder-gray-400 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  placeholder="234"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-white">Phone number</label>
                <Input
                  type="tel"
                  value={accountData.phoneNumber}
                  readOnly
                  disabled
                  className="bg-[#FFFFFF0F] w-[550px] border-gray-600 text-white placeholder-gray-400 cursor-not-allowed"
                  placeholder="49883988585"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-white">Email</label>
                <Input
                  type="email"
                  value={accountData.email}
                  readOnly
                  disabled
                  className="bg-[#FFFFFF0F] w-[550px] border-gray-600 text-white placeholder-gray-400 cursor-not-allowed"
                  placeholder="diegopereira.workflow@gmail.com"
                />
              </div>
            </div>

            {/* About Section */}
            <div className="mb-6 bg-[#D0AEF512] rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-white">About</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>

            {/* Contact Us Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-white">Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-300">Phone number</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-gray-300">Email- xyz@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  loadAccountDetails(); // Reset to original data
                }}
                disabled={isSaving}
                className="bg-[#F5F5F524] border-[#0E0E2C66] text-white hover:bg-[#FFFFFF0F]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
