'use client'

import { HandCoinsIcon, Home } from 'lucide-react'
import SidebarItem from './sidebar-item'

const SidebarRoutes = ({ courses = [], applicationID }) => {
  const userCourse = courses?.find((course) => course.id === applicationID);

  const routes = [
    {
      id: 1,
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
  ];

  // Only show Finance Info if course is not hybrid
  if (userCourse && !userCourse.course_title?.includes("Hybrid")) {
    routes.push({
      id: 2,
      label: "Finance Info",
      href: "/dashboard/finance-info",
      icon: HandCoinsIcon,
    });
  }

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
  );
};

export default SidebarRoutes
