'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Loader from '@/components/Loader' // Make sure to create this component

export default function ClientLayout({ children }) {
    const pathname = usePathname()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        const timeoutId = setTimeout(() => setLoading(false), 500)
        return () => clearTimeout(timeoutId)
    }, [pathname])

    return <>{loading ? <Loader /> : children}</>
}
