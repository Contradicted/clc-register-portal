'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SidebarItem = ({ icon: Icon, label, href }) => {
    const pathname = usePathname()

    const isActive = href === pathname || pathname.startsWith(`${href}/`)

    return (
        <Link
            href={href}
            className={cn(
                'group w-full p-4 flex items-center gap-x-3 bg-transparent rounded-[10px] text-[#718096] font-medium max-h-[47px] text-sm transition-all hover:text-black',
                isActive &&
                    'bg-black text-white font-semibold rounded-[10px] hover:bg-black/90 hover:text-white'
            )}
        >
            <Icon
                size={20}
                className={cn(
                    'stroke-2 stroke-[#718096] group-hover:stroke-black',
                    isActive && 'stroke-white group-hover:stroke-white'
                )}
            />
            {label}
        </Link>
    )
}

export default SidebarItem
