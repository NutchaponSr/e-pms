import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getFirstNameFromFullName } from "@/lib/utils";

import { ApplicationsList } from "@/components/applications-list";
import { Header } from "@/components/header";
import { VersionLog } from "@/components/version-log";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const name = getFirstNameFromFullName(session?.user?.name || "");

  return (
    <div className="z-1 order-3 w-full h-dvh overflow-x-hidden overflow-y-auto">
      <Header />
      <div className="relative cursor-default w-full grid md:grid-cols-[minmax(0,96px)_minmax(0,1fr)_minmax(0,96px)] grid-cols-[minmax(0,16px)_minmax(0,1fr)_minmax(0,16px)]">
        <div className="relative min-h-[100px] isolation-auto col-span-full">
          <div className="grid md:grid-cols-[minmax(0,96px)_minmax(0,1fr)_minmax(0,96px)] grid-cols-[minmax(0,16px)_minmax(0,1fr)_minmax(0,16px)] relative min-h-[100px] isolation-auto">
            <div className="relative pt-8 isolation-auto min-w-0 col-start-2">
              <section className="flex justify-between items-start lg:items-center relative w-full min-w-0 isolation-auto flex-col lg:flex-row gap-3 sm:gap-4">
                <div className="flex gap-5 min-w-0 w-full lg:w-auto">
                  <h1 className="text-xl sm:text-2xl font-semibold leading-snug sm:leading-7 text-primary text-balance">
                    Hi {name}, How can we help you?
                  </h1>
                </div>
                <VersionLog />
              </section>
            </div>
          </div>
        </div>
        <div className="col-start-2 flex flex-col gap-5">
          <article className="flex flex-col gap-8">
            <ApplicationsList />
          </article>
        </div>
      </div>
    </div>
  );
}

export default Page;