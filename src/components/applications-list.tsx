import { LayoutGridIcon } from "lucide-react";

import { APP_CATEGORIES } from "@/constants";

import { ApplicationCard } from "@/components/application-card";

export const ApplicationsList = () => {
  return (
    <section className="relative flex flex-col justify-start w-full gap-0">
      <div className="flex items-center justify-between h-11 w-full mx-2">
        <div className="flex items-center gap-2">
          <LayoutGridIcon className="size-3.5 block text-[#ada9a3] shrink-0" />
          <h3 className="text-secondary text-xs leading-4 font-medium">
            Applications
          </h3>
        </div>
      </div>
      <div className="w-full">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {APP_CATEGORIES.flatMap((category) => (
            category.items.map((item) => (
              <ApplicationCard 
                key={item.title} 
                {...item}
              />
            ))
          ))}
        </div>
      </div>
    </section>
  );
}