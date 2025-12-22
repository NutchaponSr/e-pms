import { Card } from "@/components/card";
import { NumberTicker } from "@/components/number-ticker";

interface Props {
  value?: number;
  title: string;
  description?: React.ReactNode;
  decimalPlaces?: number;
}

export const StateInfo = ({ value, title, description, decimalPlaces = 0 }: Props) => {
  return (
    <Card className="h-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-col text-secondary">
          <span className="text-xs font-medium uppercase tracking-wide">
            {title}
          </span>
          {description}
        </div>
        {value != null && (
          <div className="flex flex-col items-start p-3">
            <NumberTicker
              value={value}
              decimalPlaces={decimalPlaces}
              className="text-3xl font-semibold tracking-tighter whitespace-pre-wrap text-primary"
            />
          </div>
        )}
      </div>
    </Card>
  );
};
