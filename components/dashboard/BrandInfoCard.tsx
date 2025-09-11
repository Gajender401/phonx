'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Users, Phone, Clock, Building } from 'lucide-react';
import { useApp } from '@/context/GlobalContext';

type BrandInfo = {
  name: string;
  companySize: number;
  email: string;
  phoneNumber: string;
  owner: string;
  ownerEmail: string;
}

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
}

interface BrandInfoCardProps {
  isAdmin: boolean;
}

const BrandInfoCard: React.FC<BrandInfoCardProps> = ({ isAdmin }) => {
  const { isAuthenticated, authLoading, selectedBrandId } = useApp();
  
  const { data: brandInfo, isLoading } = useQuery<ApiResponse<BrandInfo>>({
    queryKey: ['brandInfo', selectedBrandId],
    queryFn: () => apiClient.get(`/statistics/brand-details/${selectedBrandId}`),
    enabled: !!selectedBrandId && isAdmin && !authLoading && isAuthenticated,
  });

  if (!isAdmin || isLoading || !brandInfo?.data) return null;

  const info = brandInfo.data;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-semibold">{info.name}</h2>
          <Building className="h-6 w-6 text-primary" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Company Size</p>
              <p className="font-medium">{info.companySize} </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Contact Number</p>
              <p className="font-medium">{info.phoneNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{info.ownerEmail}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <p className="font-medium">{info.owner}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BrandInfoCard; 