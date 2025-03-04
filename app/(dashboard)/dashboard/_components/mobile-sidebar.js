'use client'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LogOut, Menu } from 'lucide-react'
import SidebarRoutes from './sidebar-routes'
import Sidebar from './sidebar'
import Image from 'next/image'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { useMedia } from 'react-use'
import { useEffect, useState } from 'react'

const MobileSidebar = ({ courses, applicationID }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isMobile = useMedia("(max-width: 1024px)", false);

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Menu size={24} className="cursor-pointer lg:hidden" />
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center mt-5 border-b border-stroke mx-6">
            <Image
              src="/logo.png"
              height={180}
              width={180}
              alt="clc-logo"
              className="mb-4"
            />
          </div>
          <div className="flex flex-col h-full w-full">
            <div className="flex-1">
              <SidebarRoutes courses={courses} applicationID={applicationID} />
            </div>
            <LogoutButton className="w-full group flex justify-start gap-x-3 text-sm font-medium mb-10 text-[#718096] focus-visible:ring-0 focus-visible:ring-offset-0">
              <LogOut
                size={20}
                className="stroke-[#718096] group-hover:stroke-black"
              />
              Logout
            </LogoutButton>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar
