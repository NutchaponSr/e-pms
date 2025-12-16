import { RefObject } from "react";
import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import { APP_CATEGORIES, appVariants } from "@/constants";

import { useSearchParams } from "@/hooks/use-search-params";

interface Props {
  ref: RefObject<HTMLDivElement | null>;
  popoverPos: { top: number; left: number; };
  filteredCategories: typeof APP_CATEGORIES;
  filteredApplications: {
    title: string;
    href: string;
    description: string;
    icon: LucideIcon;
  }[];
}

export const SearchPopover = ({
  ref,
  popoverPos,
  filteredCategories,
  filteredApplications,
}: Props) => {
  const router = useRouter();

  const [, setSearchParams] = useSearchParams();
  
  return (
    <div
      ref={ref}
      style={{
        top: popoverPos.top + 4,
        left: popoverPos.left,
      }}
      className="absolute z-1000 bg-popover rounded-sm shadow-[0_14px_28px_-6px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),0_0_0_1.25px_rgba(84,72,49,0.08)] w-96 max-h-[560px] overflow-auto"
    >
      {filteredCategories.length == 0 && filteredApplications.length == 0 && (
        <div className="flex flex-col gap-2 p-2">
          <div className="mx-1 text-xs text-tertiary font-medium">
            Not found
          </div>
        </div>
      )}
      {filteredCategories.length > 0 && (
        <div className="flex flex-col gap-2 p-2">
          <div className="mx-1 text-secondary font-medium text-xs">
            Categories
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filteredCategories.map((item, index) => (
              <button 
                key={index}
                className={cn(
                  "inline-flex select-none transition px-2 py-1 flex-row items-center h-6 gap-2 shrink-0 w-fit justify-center text-wrap rounded-full text-primary text-xs hover:opacity-70",
                  appVariants({ border: item.border, background: item.background })
                )}
                onClick={() => setSearchParams({ category: item.title })}
              >
                <item.categoryIcon className={cn("size-3", appVariants({ icon: item.icon }))} />
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <hr className="h-[1.25px] bg-border" />
      {filteredApplications.length > 0 && (
        <div className="flex flex-col gap-2 p-2">
          <div className="mx-1 text-secondary font-medium text-xs">
            Applications
          </div>
          <div className="flex flex-col gap-1.5">
            {filteredApplications.map((item) => (
              <button 
                key={item.title} 
                onClick={() => router.push(item.href)}
                className="min-h-14 rounded hover:bg-accent inline-flex items-center p-2.5 gap-2.5"
              >
                <div className="flex justify-center items-center size-8">
                  <item.icon className="size-5 text-tertiary" />
                </div>
                <div className="whitespace-nowrap overflow-hidden text-start">
                  <h4 className="whitespace-nowrap overflow-hidden text-ellipsis text-sm text-primary font-medium">{item.title}</h4>
                  <p className="whitespace-nowrap overflow-hidden text-ellipsis text-xs text-tertiary">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}