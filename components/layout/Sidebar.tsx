'use client'
import { cn } from '@/lib/utils';
import { useApp } from '@/context/GlobalContext';
import { Home, ClipboardList, Phone, Users, Bot, Settings, LogOut, ChevronLeft, ChevronRight, HelpCircle, Crown, History, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Home,
  ClipboardList,
  Phone,
  PhoneCall,
  Users,
  Bot,
  Settings,
  HelpCircle,
  History
};

export const Sidebar = () => {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    getMenuItems,
    logout
  } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  
  const menuItems = getMenuItems().map(item => ({
    ...item,
    IconComponent: iconMap[item.icon]
  }));

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') {
      return true;
    }
    return pathname.startsWith(path) && path !== '/';
  };


  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
      // Even if logout fails, redirect to login
      router.push('/login');
    }
  };
  
  return (
    <>
      <div
        className={cn("fixed top-0 left-0 h-full transition-all duration-300 z-10 bg-sidebar-background", isSidebarCollapsed ? "w-20" : "w-64")}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn("flex items-center justify-center py-6", isSidebarCollapsed ? "px-2" : "px-6")}>        
            {!isSidebarCollapsed ? (
              <Image 
                src="/logo-big.svg" 
                alt="Phonx Logo" 
                width={120} 
                height={40}
                className="h-10 w-auto"
              />
            ) : (
              <Image 
                src="/logo-small.svg" 
                alt="Phonx Logo" 
                width={32} 
                height={32}
                className="h-8 w-8"
              />
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4">
            <TooltipProvider delayDuration={300}>
              <ul className="space-y-2">
                {menuItems.map(item => (
                  <li key={item.path}>
                    {isSidebarCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.path}
                            className={cn(
                              "flex items-center justify-center p-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200",
                              isActive(item.path) && "bg-sidebar-primary text-sidebar-primary-foreground dark:bg-[#9653DB] dark:border-2 dark:border-brand-purple-border"
                            )}
                          >
                            <item.IconComponent className="h-5 w-5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200",
                          isActive(item.path) && "bg-sidebar-primary text-sidebar-primary-foreground dark:bg-[#9653DB] dark:border-2 dark:border-brand-purple-border"
                        )}
                      >
                        <item.IconComponent className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </TooltipProvider>
          </nav>

          {/* Logout Button */}
          <div className="px-4 pb-4">
            {isSidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-center p-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </Button>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Sidebar;