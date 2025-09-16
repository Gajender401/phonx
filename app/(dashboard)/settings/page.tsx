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
    <div className="content-area">
      <GlobalHeader title="Settings" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 component-shadow card-radius bg-white md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Account Details</h3>
            <div className="space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      loadAccountDetails(); // Reset to original data
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#0B6BAF] hover:bg-[#0B6BAF]/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Company Name</label>
              <Input 
                type="text" 
                value={accountData.companyName} 
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                readOnly={!isEditing} 
                className={!isEditing ? "bg-gray-50" : ""} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Admin Name</label>
                <Input 
                  type="text" 
                  value={accountData.adminName} 
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  readOnly={!isEditing} 
                  className={!isEditing ? "bg-gray-50" : ""} 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Email Address</label>
                <div className="flex">
                  <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                    <Mail size={16} className="text-gray-500" />
                  </div>
                  <Input 
                    type="email" 
                    value={accountData.email} 
                     readOnly 
                     disabled
                     className="rounded-l-none bg-gray-50 cursor-not-allowed opacity-80" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Phone Number</label>
                <div className="flex">
                  <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                    <Phone size={16} className="text-gray-500" />
                  </div>
                  <Input 
                    type="tel" 
                    value={accountData.phoneNumber} 
                     readOnly 
                     disabled
                     className="rounded-l-none bg-gray-50 cursor-not-allowed opacity-80" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Company Size</label>
                <div className="flex">
                  <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                    <Building size={16} className="text-gray-500" />
                  </div>
                  <Input 
                    type="text" 
                    value={accountData.companySize} 
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
                    readOnly={!isEditing} 
                    className={`rounded-l-none ${!isEditing ? "bg-gray-50" : ""}`} 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Password</h3>
            
            {passwordResetStep === 'idle' && (
              <Button 
                onClick={() => setPasswordResetStep('request')}
                className="bg-[#0B6BAF] hover:bg-[#0B6BAF]/90"
              >
                <Lock size={16} className="mr-2" />
                Reset Password
              </Button>
            )}

            {passwordResetStep === 'request' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Reset Password</h4>
                  <Button variant="ghost" size="sm" onClick={cancelPasswordReset}>
                    <ArrowLeft size={16} />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  A verification code will be sent to your registered email address: <strong>{accountData.email}</strong>
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handlePasswordResetRequest}
                    disabled={isResettingPassword}
                    className="bg-[#0B6BAF] hover:bg-[#0B6BAF]/90"
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
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Enter Verification Code</h4>
                  <Button variant="ghost" size="sm" onClick={cancelPasswordReset}>
                    <ArrowLeft size={16} />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Enter the verification code sent to <strong>{accountData.email}</strong>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Verification Code</label>
                    <Input 
                      type="text" 
                      placeholder="Enter verification code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      disabled={isResettingPassword}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">New Password</label>
                    <div className="relative">
                      <Input 
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isResettingPassword}
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
                    <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
                    <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={handleConfirmPasswordChange}
                        disabled={isResettingPassword}
                        className={!passwordsMatch ? "border-red-500" : ""}
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
                    className="bg-[#0B6BAF] hover:bg-[#0B6BAF]/90"
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
        </Card>
        
        <Card className="p-5 component-shadow card-radius bg-white">
          <h3 className="text-lg font-semibold mb-4">About</h3>
          <p className="text-sm text-gray-600 mb-6">
            This platform helps businesses manage their calls, staff, and AI assistant Claire.
            Keep track of all communications in one place and improve customer service.
          </p>
          
          <h3 className="text-lg font-semibold mb-4">Contact Support</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-gray-500 " />
              <a href="mailto:support@company.com" className="text-gray-500 hover:underline">support@company.com</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-500" />
              <a href="tel:+18001234567" className="text-gray-500 hover:underline">1-800-123-4567</a>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              Version 1.0.0 | &copy; 2025 UI Onboarding
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
