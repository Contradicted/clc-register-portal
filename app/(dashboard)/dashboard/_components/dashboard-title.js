'use client'

import { routeToTitle } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const DashboardTitle = () => {
    const pathname = usePathname()
    const pageTitle = routeToTitle(pathname)
    return <h1 className="font-semibold text-2xl">{pageTitle}</h1>
}

export default DashboardTitle
