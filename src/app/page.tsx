import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { SignOutButton } from "@/modules/auth/ui/components/sign-out-button";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen">
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(session, null, 2)}
      </pre>

      <SignOutButton />
    </div>
  );
}

export default Page;