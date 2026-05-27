import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Period } from "@/generated/prisma/enums";
import { ClockIcon } from "lucide-react";

interface Props {
  period: Period;
  midYearLevel: number | null | undefined;
}

const formatLevel = (level: number | null | undefined) =>
  level != null ? `Level ${level}` : "-";

export const HistoryResultPopover = ({
  period,
  midYearLevel,
}: Props) => {
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
            ประวัติผลการประเมิน (Evaluation Result History)
          </p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64 p-0">
        <table className="w-full border-collapse">
          <thead className="border-b border-border bg-[#2383e224]">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-marine">
                Mid-year Evaluation
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 text-xs text-primary">
                {formatLevel(midYearLevel)}
              </td>
            </tr>
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  );
};
