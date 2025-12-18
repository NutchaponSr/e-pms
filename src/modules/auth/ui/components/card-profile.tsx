import { Employee } from "@/generated/prisma/client";

import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

interface Props {
  children: React.ReactNode;
  employee?: Employee;
}

export const CardProfile = ({ employee, children }: Props) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent align="start" alignOffset={-6} sideOffset={8} side="bottom" className="max-w-100 min-w-70 p-3">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <UserAvatar
              name={employee?.name || ""}
              className={{
                container: "size-10",
                fallback: "text-xl font-bold bg-[#ffffff18]! rounded-full"
              }}
            />
            <div className="flex flex-col gap-[3px] overflow-hidden w-full">
              <h3 className="text-sm leading-5 text-primary whitespace-nowrap overflow-hidden text-ellipsis font-semibold">
                {employee?.name || ""}
              </h3>
              <h5 className="text-xs leading-4 text-secondary whitespace-break-spaces overflow-hidden text-ellipsis">
                {employee?.department || ""}
              </h5>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}