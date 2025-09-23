import React from 'react';
import { useApp } from '@/context/GlobalContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BrandFilter = () => {
  const { brands, selectedBrandId, setSelectedBrand, setSelectedBrandId } = useApp();

  return (
    <div className="flex items-center gap-2">
      <Select
      
        value={selectedBrandId || 'all'}
        onValueChange={(value) => {
          if (value === 'all') {
            setSelectedBrandId('all');
            setSelectedBrand(null);
            return;
          }
          const brand = brands.find(b => b.id === value) || null;
          setSelectedBrandId(value);
          setSelectedBrand(brand);
        }}
      >
        <SelectTrigger isShowIconBlack={true} className="w-full sm:w-40 bg-background">
          <SelectValue placeholder="All Brands" />
        </SelectTrigger>
        <SelectContent className="bg-background">
          <SelectItem value="all">All Brands</SelectItem>
          {brands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id}>
              {brand.brandName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BrandFilter; 