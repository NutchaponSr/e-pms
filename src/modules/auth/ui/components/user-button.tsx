import { headers } from "next/headers";
import { ChevronDownIcon } from "lucide-react";

import { auth } from "@/lib/auth";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { SignOutButton } from "@/modules/auth/ui/components/sign-out-button";

export const UserButton = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div role="button" className="transition cursor-pointer flex items-center w-auto min-w-0 h-8 m-2 rounded-sm select-none hover:bg-accent">
          <div className="flex items-center w-full text-sm min-h-7 h-[30px] py-1 px-2 overflow-hidden ms-0">
            <UserAvatar 
              name={session?.user?.name || ""}
              className={{
                container: "shrink-0 grow-0 rounded size-[22px] flex items-center justify-center me-2",
                fallback: "bg-[#ffffff18]! rounded text-secondary!"
              }}
            />
            <div className="grow shrink basis-auto whitespace-nowrap overflow-hidden text-ellipsis">
              <div className="flex items-center justify-between">
                <div className="flex flex-col me-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-5 unicode">
                    My workspace
                  </div>
                </div>

                <ChevronDownIcon className="size-4 text-[#ada9a3] shrink-0 grow-0"/>
              </div>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" side="bottom" sideOffset={6} align="start">
        <div className="flex flex-col gap-3 p-3 bg-[#252525] rounded-sm">
          <div className="flex flex-row gap-2.5 items-center">
            <UserAvatar 
              name={session?.user?.name || ""}
              className={{
                container: "shrink-0 grow-0 rounded size-9 flex items-center justify-center",
                fallback: "bg-[#ffffff18]! rounded text-secondary! text-xl"
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
          <div className="w-full h-[1.25px] border-b border-[#383836]" />
        </div>
        <div className="bg-[#202020] shrink-0 rounded-b-sm">
          <div className="flex flex-col gap-px relative p-1 mt-px">
            <SignOutButton />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}