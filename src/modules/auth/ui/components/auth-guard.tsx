"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { Loader } from "@/components/loader";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter(); 
  const { isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      router.push("/");
    }
  }, [isPending]);

  if (isPending) {
    return <Loader />
  }

  return children;
}