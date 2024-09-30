"use client";

import { useToast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ValidateToken() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { toast } = useToast();

  useEffect(() => {
    async function validateToken() {
      if (token) {
        const res = await fetch(`/api/validate-token?token=${token}`);
        const data = await res.json();

        console.log("foo", data);

        if (data.valid) {
          console.log("yes");
          router.push("/application");
        } else {
          toast({
            variant: "destructive",
            title: data.error,
          });
          router.push("/dashboard");
        }
      } else {
        console.log("didnt");
        router.push("/dashboard");
      }
    } 

    validateToken();
  }, [router, token, toast]);

  return <div>Validating token...</div>;
}
