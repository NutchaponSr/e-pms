import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getFirstNameFromFullName } from "@/lib/utils";

import { SearchCommand } from "@/components/search-command";
import { CategoryCarasel } from "@/components/category-carousel";
import { ApplicationsList } from "@/components/applications-list";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const name = getFirstNameFromFullName(session?.user?.name || "");

  return (
    <div className="z-1 order-3 w-full h-dvh overflow-x-hidden overflow-y-auto">
      <div className="relative cursor-default w-full grid grid-cols-[minmax(0,96px)_minmax(0,1fr)_minmax(0,96px)]">
        <div className="relative min-h-[100px] isolation-auto col-span-full">
          <div className="grid grid-cols-[minmax(0,96px)_minmax(0,1fr)_minmax(0,96px)] relative min-h-[100px] isolation-auto">
            <div className="relative pt-8 isolation-auto min-w-0 col-start-2">
              <section className="flex justify-between items-center relative w-full isolation-auto lg:flex-row flex-col gap-4">
                <div className="flex gap-5">
                  <h1 className="text-2xl font-semibold leading-6 text-primary">
                    Hi {name}, How can we help you?
                  </h1>
                </div>
                <SearchCommand />
              </section>
            </div>
          </div>
        </div>
        <div className="col-start-2 flex flex-col gap-5">
          <article className="flex flex-col gap-8">
            <CategoryCarasel />
            <ApplicationsList />
          </article>
        </div>
      </div>
    </div>
  );
}

export default Page;