import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";

import { Header } from "@/components/header";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== UserRole.ADMIN) {
    redirect("/");
  }

  return (
    <div className="order-3 flex flex-col w-full bg-transparent relative">
      <Header />
      <main className="grow-0 shrink flex flex-col bg-background z-1 h-full max-h-full w-full overflow-hidden">
        <div className="contents">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
