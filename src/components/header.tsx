"use client";

import { Breadcrumb } from "@/components/breadcrumb";
import { useSidebar } from "@/hooks/use-sidebar";
import { ModeToggle } from "./toggle-mode";
import { Button } from "./ui/button";
import { MenuIcon } from "lucide-react";

export const Header = () => {
  const { isCollapsed, resetWidth } = useSidebar();

  return (
    <header className="bg-transparent max-w-[100vw] select-none relative">
      <div className="flex justify-between items-center h-11 overflow-hidden px-3">
        {isCollapsed && (
          <Button size="icon" variant="ghost" onClick={resetWidth}>
            <MenuIcon className="size-5 text-primary" />
          </Button>
        )}
        <Breadcrumb />
        <div className="grow shrink" />
        <ModeToggle /> 
      </div>
    </header>
  );
}