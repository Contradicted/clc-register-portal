import Image from 'next/image'

import { Button } from '@/components/ui/button'

import SidebarRoutes from './sidebar-routes'
import { LogOut } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { cn } from '@/lib/utils'

const Sidebar = ({ className }) => {
    return (
        <div className={cn('h-full flex flex-col bg-[#FAFAFA]', className)}>
            <div className="flex items-center justify-center mt-5 border-b border-stroke mx-6">
                <Image
                    src="/logo.svg"
                    height={180}
                    width={180}
                    alt="clc-logo"
                    className="mb-4"
                />
            </div>
            <div className="flex flex-col px-6 h-full w-full">
                <div className="flex-1">
                    <SidebarRoutes />
                </div>
                <LogoutButton className="w-full group flex justify-start gap-x-3 text-sm font-medium mb-10 text-[#718096] ring-0">
                    <LogOut
                        size={20}
                        className="stroke-[#718096] group-hover:stroke-black"
                    />
                    Logout
                </LogoutButton>
            </div>
        </div>
    )
}

export default Sidebar
