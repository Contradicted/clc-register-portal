"use client";

import { logout } from "@/actions/logout";
import { Button } from "@/components/ui/button";

export const LogoutButton = ({ children }) => {

    const onClick = () => {
        logout();
    }
    return (
        <span onClick={onClick} className="cursor-pointer text-sm w-fit">
            <Button variant="ghost">
                {children}
            </Button>
        </span>
    )
}