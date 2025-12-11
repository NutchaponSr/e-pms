"use client";

import { authClient } from "@/lib/auth-client";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isPending } = authClient.useSession();


  if (isPending) {
    return (
      <>
        Loading...
      </>
    );
  }

  if (!session) {
    return (
      <>
        Unauthorized
      </>
    );
  }

  return children;
}