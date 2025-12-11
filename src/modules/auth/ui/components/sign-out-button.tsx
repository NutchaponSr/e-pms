"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export const SignOutButton = () => {
  const router = useRouter();

  const onSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/sign-in");
        },
      },
    });
  }

  return (
    <button 
      onClick={onSignOut}
      className="select-none transition hover:bg-accent w-full flex rounded-sm"
    >
      <div className="flex items-center gap-2 leading-[120%] select-none min-h-7 text-sm px-2">
        <div className="flex text-secondary text-xs ps-0">
          Logout
        </div>
      </div>
    </button>
  );
}
