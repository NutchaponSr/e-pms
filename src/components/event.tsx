import { cn } from "@/lib/utils";

import { Status } from "@/generated/prisma/enums";

import { StatusBadge } from "@/components/status-badge";

import { StatusVariant } from "@/modules/tasks/types";

interface Props {
  dueDate: string;
  title: string;
  description: string;
  status?: {
    label: string;
    variant: StatusVariant;
  };
  buttonCtx: {
    label: string;
    onClick: () => void;
    active: boolean;
  };
}

export const Event = ({ 
  dueDate, 
  title, 
  description, 
  status = { label: "Not Started", variant: "purple" },
  buttonCtx,
}: Props) => {
  return (
    <div className="flex flex-row pb-2.5 last:pb-0">
      <div className="w-1/5 pe-2.5 flex flex-col text-xs font-medium">
        {dueDate}
      </div>
      <div className="w-4/5">
        <div className="mb-3.5 flex">
          <div className="flex w-full gap-1 overflow-hidden">
            <div className={cn(
              "w-1 rounded shrink-0", 
              buttonCtx.active ? "bg-[#2f2f2f]" : "bg-description/10 border-description border border-dashed"
            )}/>
            <div className="flex flex-col">
              <div className="flex flex-col grow shrink ps-2.5 overflow-hidden">
                <div className="flex items-center gap-2 h-[22px] overflow-hidden min-w-0">
                  <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis text-secondary">{title}</span>
                  <StatusBadge {...status} />
                </div>
                <span className="text-xs leading-5">{description}</span>
              </div>
              <div className="mt-1.5 ps-2.5">
                <button 
                  onClick={buttonCtx.onClick}
                  data-active={buttonCtx.active} 
                  className="w-fit pt-0.5 px-2 flex-row bg-[#252525] rounded items-center min-h-6 hover:bg-[#2f2f2f] data-[active=true]:flex hidden"
                >
                  {buttonCtx.label}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}