"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const SignInScreen = () => {
  const router = useRouter();

  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await authClient.signIn.username({
      password,
      username: employeeId,
      fetchOptions: {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onSuccess: () => {
          router.refresh();
        },
        onError: (error) => {
          setError(error.error?.message || "An unknown error occurred");
        },
      },
    });
  }

  return (
    <>
      <div className="flex flex-col">
        <h1 className="text-wrap whitespace-normal [word-break:break-word] text-2xl">Sign In</h1>
        <h3 className="text-wrap whitespace-normal [word-break:break-word] text-base text-muted-foreground">
          Welcome back to e-PMS!
        </h3>
      </div>

      <form className="flex flex-col gap-5 order-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground text-xs font-semibold">Employee ID</Label>
          <Input 
            required
            value={employeeId}
            disabled={isPending}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground text-xs font-semibold">Last 5 digits of your citizen ID</Label>
          <Input 
            required
            type="password" 
            value={password} 
            disabled={isPending}
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <Button 
          size="lg"
          disabled={isPending}
          type="submit"
        >
          Continue
        </Button>
      </form>
    </>
  );
}