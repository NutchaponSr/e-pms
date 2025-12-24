import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Period } from "@/generated/prisma/enums";
import { ClockIcon } from "lucide-react";

interface Props {
  period: Period;
  actual: string | null | undefined;
}

export const HistoryActualPopover = ({ period, actual }: Props) => {
  if (period === Period.EVALUATION_1ST) {
    return null;
  }

  return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon">
                <ClockIcon />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="p-0" sideOffset={4}>
            <p className="px-2 py-1 text-xs text-white font-medium">
              Evaluation 1st&apos;s Detail
            </p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent>
          {actual ? (
            <div className="flex flex-col items-start">
              <p className="text-xs text-primary">
                {actual}
              </p>
            </div>
          ) : "-"}
        </PopoverContent>
      </Popover>  
  );
}