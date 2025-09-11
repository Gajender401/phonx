'use client'
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface LoaderProps {
  /** Size variant of the loader */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show the loading text */
  showText?: boolean;
  /** Custom loading text */
  text?: string;
  /** Whether to center the loader in full screen */
  fullScreen?: boolean;
  /** Whether to use the custom logo instead of spinner */
  useCustomLogo?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Background overlay for fullscreen loader */
  overlay?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  showText = false,
  text = 'Loading...',
  fullScreen = false,
  useCustomLogo = true,
  className,
  overlay = false
}) => {
  const LoaderContent = () => (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      className
    )}>
      {useCustomLogo ? (
        <div className={cn(
          "relative animate-oscillate",
          size === 'sm' && 'h-8 w-8',
          size === 'md' && 'h-12 w-12',
          size === 'lg' && 'h-16 w-16',
          size === 'xl' && 'h-24 w-24'
        )}>
          <Image
            src="/loader.png"
            alt="Loading"
            fill
            className="object-contain"
            priority
          />
        </div>
      ) : (
        <Loader2 className={cn(
          "animate-spin text-primary",
          sizeClasses[size]
        )} />
      )}
      
      {showText && (
        <p className={cn(
          "text-muted-foreground font-medium",
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        overlay ? "bg-background/30 backdrop-blur-md" : "bg-background"
      )}>
        <LoaderContent />
      </div>
    );
  }

  return <LoaderContent />;
};

// Pre-configured loader variants for common use cases
export const PageLoader: React.FC<Omit<LoaderProps, 'fullScreen'>> = (props) => (
  <Loader {...props} fullScreen={true} size="lg" showText={false} />
);

export const DataLoader: React.FC<Omit<LoaderProps, 'fullScreen'>> = (props) => (
  <div className="flex justify-center py-8">
    <Loader {...props} size="md" showText={false} />
  </div>
);

export const InlineLoader: React.FC<Omit<LoaderProps, 'fullScreen' | 'showText'>> = (props) => (
  <Loader {...props} showText={false} size="sm" />
);

export const OverlayLoader: React.FC<Omit<LoaderProps, 'fullScreen' | 'overlay'>> = (props) => (
  <Loader {...props} fullScreen={true} overlay={true} size="lg" showText={false} />
);

export default Loader; 