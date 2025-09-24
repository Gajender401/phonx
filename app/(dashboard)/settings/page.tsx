'use client'
import React, { useState, useEffect } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, Building, Lock, Save, Loader2 } from 'lucide-react';
import { getAccountDetails, updateAccountDetails, AccountDetails } from '@/lib/settings.service';
import { toast } from '@/components/ui/use-toast';
import { useApp } from '@/context/GlobalContext';
import { ResetPasswordModal } from '@/components/ResetPasswordModal';
import { useTheme } from '@/context/ThemeContext';

const Settings = () => {
  const { isAuthenticated, authLoading } = useApp();
  const { resolvedTheme } = useTheme();
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
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

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
              <h1 className={`text-2xl font-semibold ${resolvedTheme === 'light' ? 'text-black' : 'text-white'}`}>Edit Details</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 bg-transparent border-[#9653DB5E] ${resolvedTheme === 'light' ? 'text-[#A15CEB] hover:bg-gray-100' : 'text-white hover:bg-gray-600'}`}
                >
                  <img src="/icons/pencile-active.svg" alt="Edit" className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setIsResetPasswordModalOpen(true)}
                  className={`border-[#9653DB54] border bg-transparent h-9 hover:bg-[#7C3AED]/90 ${resolvedTheme === 'light' ? 'text-[#A15CEB]' : 'text-white'}`}
                >
                  Reset Password 
                </Button>
              </div>
            </div>


            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className={`text-sm font-medium mb-2 block ${resolvedTheme === 'light' ? 'text-black' : 'text-white'}`}>Admin Name</label>
                <Input
                  type="text"
                  value={accountData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  readOnly={!isEditing}
                  className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 ${resolvedTheme === 'light' ? 'text-black placeholder-gray-600' : 'text-white placeholder-gray-400'} ${!isEditing ? "cursor-not-allowed" : ""}`}
                  placeholder="Diego Matos"
                />
              </div>

              <div>
                <label className={`text-sm font-medium mb-2 block ${resolvedTheme === 'light' ? 'text-black' : 'text-white'}`}>Company Name</label>
                <Input
                  type="text"
                  value={accountData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  readOnly={!isEditing}
                  className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 ${resolvedTheme === 'light' ? 'text-black placeholder-gray-600' : 'text-white placeholder-gray-400'} ${!isEditing ? "cursor-not-allowed" : ""}`}
                  placeholder="XYZ"
                />
              </div>

              <div>
                <label className={`text-sm font-medium mb-2 block ${resolvedTheme === 'light' ? 'text-black' : 'text-white'}`}>Company Size</label>
                <Input
                  type="text"
                  value={accountData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                  readOnly={!isEditing}
                  className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 ${resolvedTheme === 'light' ? 'text-black placeholder-gray-600' : 'text-white placeholder-gray-400'} ${!isEditing ? "cursor-not-allowed" : ""}`}
                  placeholder="234"
                />
              </div>

              <div>
                <label className={`text-sm font-medium mb-2 block ${resolvedTheme === 'light' ? 'text-black' : 'text-white'}`}>Phone number</label>
                <Input
                  type="tel"
                  value={accountData.phoneNumber}
                  readOnly
                  disabled
                  className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 ${resolvedTheme === 'light' ? 'text-black placeholder-gray-600' : 'text-white placeholder-gray-400'} cursor-not-allowed`}
                  placeholder="49883988585"
                />
              </div>

              <div>
                <label className={`text-sm font-medium mb-2 block ${resolvedTheme === 'light' ? 'text-black' : 'text-white'}`}>Email</label>
                <Input
                  type="email"
                  value={accountData.email}
                  readOnly
                  disabled
                  className={`bg-[#FFFFFF0F] w-[550px] border-gray-600 ${resolvedTheme === 'light' ? 'text-black placeholder-gray-600' : 'text-white placeholder-gray-400'} cursor-not-allowed`}
                  placeholder="diegopereira.workflow@gmail.com"
                />
              </div>
            </div>

            {/* About Section */}
            <div className="mb-6 bg-[#D0AEF512] rounded-lg p-4">
              <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'light' ? 'text-black' : 'text-white'}`}>About</h3>
              <p className={`text-sm leading-relaxed ${resolvedTheme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>

            {/* Contact Us Section */}
            <div className="mb-8">
              <h3 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'light' ? 'text-black' : 'text-white'}`}>Contact Us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={16} className={`${resolvedTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                  <span className={`${resolvedTheme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Phone number</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className={`${resolvedTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                  <span className={`${resolvedTheme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Email- xyz@gmail.com</span>
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
                className={`bg-[#F5F5F524] border-[#0E0E2C66] ${resolvedTheme === 'light' ? 'text-[#A15CEB] hover:bg-gray-100' : 'text-white hover:bg-[#FFFFFF0F]'}`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className={`bg-[#7C3AED] hover:bg-[#7C3AED]/90 ${resolvedTheme === 'light' ? 'text-[#A15CEB]' : 'text-white'}`}
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

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        userEmail={accountData.email}
      />
    </div>
  );
};

export default Settings;
