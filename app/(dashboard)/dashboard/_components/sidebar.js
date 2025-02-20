import Image from 'next/image'

import { Button } from '@/components/ui/button'

import SidebarRoutes from './sidebar-routes'
import { LogOut } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { cn } from '@/lib/utils'
import { getActiveCourses } from "@/data/courses";
import { getApplicationIDByUserID } from "@/data/application";
import { currentUser } from "@/lib/auth";

const Sidebar = async ({ className }) => {

    const courses = await getActiveCourses();
    const user = await currentUser();
    const applicationID = await getApplicationIDByUserID(user.id);

    return (
        <div className={cn('h-full flex flex-col bg-[#FAFAFA]', className)}>
            <div className="flex items-center justify-center mt-5 border-b border-stroke mx-6">
                <Image
                    src="/logo.png"
                    height={180}
                    width={180}
                    alt="clc-logo"
                    className="mb-4"
                />
            </div>
            <div className="flex flex-col px-6 h-full w-full">
                <div className="flex-1">
                    <SidebarRoutes courses={courses} applicationID={applicationID} />
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
