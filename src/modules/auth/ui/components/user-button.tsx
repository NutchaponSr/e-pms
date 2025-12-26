"use client";

import { useState } from "react";
import { GoMoveToStart } from "react-icons/go";
import { ChevronDownIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";

import { useSidebar } from "@/hooks/use-sidebar";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { SignOutButton } from "@/modules/auth/ui/components/sign-out-button";

export const UserButton = () => {
  const { collapse } = useSidebar();
  const { data: session } = authClient.useSession();

  const [open, setOpen] = useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div 
          role="button" 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(!open)
          }}
          className="transition flex items-center min-w-0 h-8 w-auto rounded hover:bg-primary/6 m-2 cursor-pointer"
        >
          <div className="flex items-center w-full text-sm min-h-7 h-[30px] py-1 px-2 overflow-hidden">
            <div className="shrink-0 grow-0 rounded text-tertiary size-6 flex items-center justify-center mr-2">
              <UserAvatar 
                className={{ container: "size-6 rounded", fallback: "rounded" }}
                name={session?.user.name || ""}
              />
            </div>
            <div className="flex-1 whitespace-nowrap min-w-0 overflow-hidden text-ellipsis">
              <div className="flex justify-start items-center">
                <h4 className="text-primary font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-5 me-1.5">
                  {session?.user.name || ""}
                </h4>
                <ChevronDownIcon className="size-4 text-tertiary" />
              </div>
            </div>
          </div>
          <div className="flex items-center h-full ml-auto">
            <div className="items-center inline-flex me-0.5 gap-0.5">
              <Button 
                variant="ghost" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  collapse();
                }}
                className="size-6.5 group-hover:opacity-100 opacity-0 transition-opacity" 
              >
                <GoMoveToStart className="size-4 text-tertiary stroke-[0.3]" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" side="bottom" sideOffset={6} align="start">
        <div className="flex flex-col gap-3 p-3 bg-popover rounded-t-sm">
          <div className="flex flex-row gap-2.5 items-center">
            <UserAvatar 
              name={session?.user?.name || ""}
              className={{
                container: "shrink-0 grow-0 rounded size-9 flex items-center justify-center",
                fallback: "bg-marine! rounded text-white! text-xl"
              }}
            />
            <div className="flex flex-col whitespace-nowrap overflow-hidden text-ellipsis">
              <div className="text-sm leading-5 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                {session?.user?.name}
              </div>
              <div className="text-xs leading-4 whitespace-nowrap overflow-hidden text-ellipsis text-secondary">
                {session?.user.email || "-"}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center pointer-events-none w-full h-[1.25px]">
          <div className="w-full h-[1.25px] border-b border-border" />
        </div>
        <div className="bg-background shrink-0 rounded-b-sm">
          <div className="flex flex-col gap-px relative p-1 mt-px">
            <SignOutButton />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}