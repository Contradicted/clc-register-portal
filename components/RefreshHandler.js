"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RefreshHandler() {
  const router = useRouter();

  useEffect(() => {
    const refreshNeeded = localStorage.getItem("refreshDashboard");
    if (refreshNeeded) {
      localStorage.removeItem("refreshDashboard");
      router.refresh();
    }
  }, [router]);

  return null;
}
