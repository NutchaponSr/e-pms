import { Card } from "@/components/card";
import { NumberTicker } from "@/components/number-ticker";
import { formatDecimal } from "@/lib/utils";

interface Props {
  title: string;
  kpi: number;
  competency: number;
  culture: number;
  total: number;
}

export const ScoreBoard = ({ title, kpi, competency, culture, total }: Props) => {
  return (
    <Card className="h-auto">
      <div className="flex flex-row">
        <div className="w-[65%] pe-3">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium tracking-wide">{title}</span>
          <div className="flex flex-row items-center justify-between h-full">
            <div className="flex w-full gap-1 overflow-hidden">
              <div className="w-1 rounded shrink-0 bg-marine/34" />
              <div className="flex flex-col">
                <div className="flex flex-col grow shrink ps-2.5 overflow-hidden">
                  <div className="flex items-center gap-2 h-[22px] overflow-hidden min-w-0">
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis text-secondary text-xs">KPI Achievement</span>
                  </div>
                </div>
              </div>
            </div>
          
            <span className="text-sm font-medium">
              {kpi}
            </span>
          </div>
          <div className="flex flex-row items-center justify-between h-full">
            <div className="flex w-full gap-1 overflow-hidden">
              <div className="w-1 rounded shrink-0 bg-marine/34" />
              <div className="flex flex-col">
                <div className="flex flex-col grow shrink ps-2.5 overflow-hidden">
                  <div className="flex items-center gap-2 h-[22px] overflow-hidden min-w-0">
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis text-secondary text-xs">Competency</span>
                  </div>
                </div>
              </div>
            </div>
          
            <span className="text-sm font-medium">
              {formatDecimal(competency)}
            </span>
          </div>
          <div className="flex flex-row items-center justify-between h-full">
            <div className="flex w-full gap-1 overflow-hidden">
              <div className="w-1 rounded shrink-0 bg-marine/34" />
              <div className="flex flex-col">
                <div className="flex flex-col grow shrink ps-2.5 overflow-hidden">
                  <div className="flex items-center gap-2 h-[22px] overflow-hidden min-w-0">
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis text-secondary text-xs">Culture</span>
                  </div>
                </div>
              </div>
            </div>
          
            <span className="text-sm font-medium">
              {formatDecimal(culture)}
            </span>
          </div>
        </div>
        </div>
        <div className="w-[35%] flex flex-col text-xs font-medium border-l-[1.5px] border-border pl-3">
          <div className="flex h-5 w-full" />
          <div className="flex flex-col justify-between h-full">
            <span className="text-sm font-medium tracking-wide text-secondary">Total</span>
            <div className="flex justify-end">
              <NumberTicker value={total} decimalPlaces={2} className="text-3xl font-medium" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}