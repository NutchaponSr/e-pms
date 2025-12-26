"use client";

import Link from "next/link";

import { IoTriangle } from "react-icons/io5";

import { useSidebar } from "@/hooks/use-sidebar";

import { APP_CATEGORIES } from "@/constants";

import { UserButton } from "@/modules/auth/ui/components/user-button";

export const Sidebar = () => {
  const { sidebarRef, width, handleMouseDown } = useSidebar();

  return (
    <aside 
      ref={sidebarRef}
      aria-label="Sidebar"
      className="order-1 grow-0 shrink-0 relative z-111 bg-sidebar shadow-[inset_-1.25px_0_0_0_rgb(238,238,236)] w-60 hover:shadow-[inset_-2.5px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[inset_-1.25px_0_0_0_rgb(42,42,42)] dark:hover:shadow-[inset_-2.5px_0_0_0_rgba(255,255,255,0.1)] group"
    >
      <div className="h-full text-secondary font-medium">
        <div style={{ width }} className="flex flex-col h-full relative visible w-60">
          <div className="flex flex-col h-full min-h-full justify-between overflow-hidden relative p-0">
            <div className="block shrink-0 grow-0">
              <UserButton />
            </div>

            <div className="pt-1.5 grow overflow-x-hidden overflow-y-auto">
              <div className="flex flex-col min-h-full">
                <div className="flex flex-col gap-3 px-2 pb-5">
                  <div className="flex flex-col gap-1">
                    <SidebarGroup>
                      <SidebarLabel>Application</SidebarLabel>
                      <div className="flex flex-col gap-px">
                        {APP_CATEGORIES.flatMap((cat) => 
                          cat.items.map((item) => (
                            <Link 
                              key={item.href} 
                              href={item.href} 
                              className="flex transition hover:bg-primary/6 rounded w-full"
                            >
                              <div className="flex items-center text-sm min-h-7 h-[30px] px-2 py-1 rounded text-secondary">
                                <div className="flex items-center justify-center shrink-0 grow-0 w-6 h-4.5 mr-2 relative">
                                  <IoTriangle className="size-3 text-[#0003] dark:text-muted rotate-90" />
                                </div>
                                <div className="flex-1 whitespace-nowrap min-w-0 overflow-hidden text-clip flex items-center">
                                  <div className="whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                                    {item.title}
                                  </div>
                                </div>
                              </div>
                            </Link>
                        )))}
                      </div>
                    </SidebarGroup>
                  </div>
                </div>
                <div className="sticky mt-auto bottom-0" />
              </div>
            </div>
          </div>
          <div 
            onMouseDown={handleMouseDown} 
            className="absolute end-0 w-[1.25px] z-1 grow-0 top-0 bottom-0"
          >
            <div className="cursor-col-resize h-full w-3" />
          </div>
        </div>
      </div>
    </aside>
  );
}

const SidebarGroup = ({ children}: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-px mb-3">
        {children}
      </div>
    </div>  
  );
}

const SidebarLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-7 px-2 flex items-center">
      <h5 className="text-primary/80 font-medium text-xs leading-none">{children}</h5>
    </div>
  );
}