'use client'

import { logout } from '@/actions/logout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const LogoutButton = ({ children, className }) => {
    const onClick = () => {
        logout()
    }
    return (
        <span onClick={onClick} className="cursor-pointer text-sm">
            <Button variant="ghost" className={className}>
                {children}
            </Button>
        </span>
    )
}
