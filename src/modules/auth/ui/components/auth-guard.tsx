"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { Loader } from "@/components/loader";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      router.push(`/auth/sign-in?callbackUrl=${callbackUrl}`);
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return <Loader />;
  }

  return children;
};
