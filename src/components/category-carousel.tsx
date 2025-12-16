"use client";

import { TrashIcon } from "lucide-react";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { APP_CATEGORIES, appVariants } from "@/constants";

import { useSearchParams } from "@/hooks/use-search-params";

export const CategoryCarasel = () => {
  const [state, setState] = useSearchParams();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollLeft = () => {
    const container = document.querySelector('.overflow-x-auto');
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.querySelector('.overflow-x-auto');
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = document.querySelector('.overflow-x-auto');
    if (container) {
      const checkScroll = () => {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
          container.scrollLeft < container.scrollWidth - container.clientWidth
        );
      };
      
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const currentCategory = APP_CATEGORIES.find((f) => f.title === state.category)!;

  return (
    <div className="gap-4 w-full lg:pt-0 pt-4">
      <div className="max-w-[calc(100%+0px)]">
        <div className="relative group">
          <div className="-mb-8 -ms-8 ">
            <div className={cn(
              "overflow-y-hidden overflow-x-auto scrollbar-hide",
              (!canScrollLeft && canScrollRight) && "[mask-[linear-gradient(to_left,transparent_0%,black_96px)]",
              (!canScrollRight && canScrollLeft) && "[mask-[linear-gradient(to_right,transparent_0%,black_96px)]",
              (canScrollLeft && canScrollRight) && "[mask-[linear-gradient(to_left,transparent_0%,black_96px,black_calc(100%-96px),transparent_100%)]"
            )}>
              <div className="flex gap-1.5 w-max mb-px pb-8 px-8">
                {state.category ? (
                  <>
                    <button 
                      className={cn(
                        "inline-flex select-none transition px-3 py-2.5 flex-row items-center h-8 gap-2 shrink-0 w-fit justify-center text-wrap rounded-full text-primary text-sm hover:opacity-70",
                        appVariants({ border: currentCategory.border, background: currentCategory.background })
                      )}
                      onClick={() => setState({ category: currentCategory.title })}
                    >
                      <currentCategory.categoryIcon className={cn("size-4", appVariants({ icon: currentCategory.icon }))} />
                      {currentCategory.title}
                    </button>
                    <button 
                      onClick={() => setState({ category: "" })}
                      className="transition flex items-center size-8 rounded-full px-2 text-sm whitespace-nowrap text-primary border-border hover:bg-accent justify-center bg-background"
                    >
                      <TrashIcon className="shrink-0 text-destructive size-4" />
                    </button>
                  </>
                ) : (
                  APP_CATEGORIES.map((item, index) => (
                    <button 
                      key={index}
                      className={cn(
                        "inline-flex select-none transition px-3 py-2.5 flex-row items-center h-8 gap-2 shrink-0 w-fit justify-center text-wrap rounded-full text-primary text-sm hover:opacity-70",
                        appVariants({ border: item.border, background: item.background })
                      )}
                      onClick={() => setState({ category: item.title })}
                    >
                      <item.categoryIcon className={cn("size-4", appVariants({ icon: item.icon }))} />
                      {item.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* {canScrollLeft && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={scrollLeft}
                className="transition flex items-center size-8 rounded-full px-2 text-sm whitespace-nowrap text-primary shadow-[0_12px_32px_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)] hover:shadow-[0_0_0_1.25px_rgba(15,15,15,0.1),0_2px_4px_rgba(15,15,15,0.1)] absolute -left-8 top-0 justify-center bg-background"
              >
                <ChevronLeftIcon className="shrink-0 text-muted size-4" />
              </button>
            </div>
          )}
          {canScrollRight && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={scrollRight}
                className="transition flex items-center size-8 rounded-full px-2 text-sm whitespace-nowrap text-primary shadow-[0_12px_32px_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)] hover:shadow-[0_0_0_1.25px_rgba(15,15,15,0.1),0_2px_4px_rgba(15,15,15,0.1)] absolute right-0 top-0 justify-center bg-background"
              >
                <ChevronRightIcon className="shrink-0 text-muted size-4" />
              </button>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}