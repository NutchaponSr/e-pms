import { cn } from "@/lib/utils";

import { Status } from "@/generated/prisma/enums";

import { StatusBadge } from "@/components/status-badge";

import { StatusVariant } from "@/modules/tasks/types";
import { Button } from "./ui/button";

interface Props {
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
    disabled: boolean;
  };
}

export const Event = ({ 
  title, 
  description, 
  status = { label: "Not Started", variant: "purple" },
  buttonCtx,
}: Props) => {
  return (
    <div className="flex flex-row pb-2.5 last:pb-0">
      <div className="w-full">
        <div className="mb-3.5 flex">
          <div className="flex w-full gap-1 overflow-hidden">
            <div className={cn(
              "flex flex-col w-full p-2 rounded",
              buttonCtx.active ? "bg-[#0080d51c] dark:bg-[#298bfd10] border border-[#0080d51c] dark:border-[#298bfd10] border-dashed" : "bg-description/10 border-description border border-dashed"
            )}>
              <div className="flex flex-col grow shrink ps-2.5 overflow-hidden gap-1">
                <div className="flex items-center gap-2 h-[22px] overflow-hidden min-w-0">
                  <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis text-secondary">{title}</span>
                  <StatusBadge {...status} />
                </div>
                <span className="text-xs leading-4">{description}</span>
              </div>
              {buttonCtx.active && (
                <div className="mt-1.5 ps-2.5">
                  <Button 
                    size="xs"
                    variant="primary"
                    onClick={buttonCtx.onClick}
                    data-active={buttonCtx.active} 
                    disabled={buttonCtx.disabled}
                    className="rounded px-2"
                  >
                    {buttonCtx.label}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}