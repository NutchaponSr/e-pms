import { Card } from "@/components/card";
import { NumberTicker } from "@/components/number-ticker";

interface Props {
  title: string;
  data?: {
    label: string;
    value: number;
  }[];
  value?: number;
}

export const StatusInfo = ({ title, data, value }: Props) => {
  return (
    <Card className="h-full">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium tracking-wide">{title}</span>
        
        {data && (
          <div className="flex flex-col gap-1">
            {data.map((item) => (
              <div key={item.label} className="flex flex-row items-center justify-between h-full">
                <div className="flex w-full gap-1 overflow-hidden">
                  <div className="w-1 rounded shrink-0 bg-marine/34" />
                  <div className="flex flex-col">
                    <div className="flex flex-col grow shrink ps-2.5 overflow-hidden">
                      <div className="flex items-center gap-2 h-5 overflow-hidden min-w-0">
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis text-secondary text-xs">{item.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              
                <span className="text-sm font-medium h-5">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {(value || value == 0) && (
          <div className="flex justify-end items-start px-3 py-1">
          <NumberTicker
            value={value}
            className="text-3xl font-semibold tracking-tighter whitespace-pre-wrap text-primary"
          />
        </div>
        )}
      </div>
    </Card>
  );
}