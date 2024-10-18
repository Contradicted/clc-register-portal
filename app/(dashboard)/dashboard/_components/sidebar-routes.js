'use client'

import { ClipboardPen, Home } from 'lucide-react'
import SidebarItem from './sidebar-item'

const routes = [
  {
    id: 1,
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  // {
  //   id: 2,
  //   label: "Course Details",
  //   href: "#",
  //   icon: ClipboardPen,
  // },
];

const SidebarRoutes = () => {
    return (
        <div className="w-full flex flex-col space-y-3 items-center justify-center mt-10">
            {routes.map((route) => (
                <SidebarItem
                    label={route.label}
                    href={route.href}
                    icon={route.icon}
                    key={route.id}
                />
            ))}
        </div>
    )
}

export default SidebarRoutes
