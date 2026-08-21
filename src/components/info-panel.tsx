import { TargetIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  chart: ReactNode;
}

export const InfoPanel = ({ title, children, chart }: Props) => {
  return (
    <section className="h-full flex flex-col">
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
          <div className="flex items-center justify-center size-4 me-2">
            <TargetIcon className="size-4 shrink-0 block text-secondary" />
          </div>
          <span className="whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm">
            {title}
          </span>
        </div>
      </div>
      <div className="px-0 z-1 relative flex flex-col rounded-lg bg-[#ffffffe6] dark:bg-[#202020e6] dark:shadow-[unset] backdrop-blur-[48px] min-h-0 max-h-full py-0 flex-1 shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)]">
        <div className="basis-0 grow px-9 pt-8 pb-6 border-b border-border">
          <div className="flex flex-col justify-start min-h-full text-tertiary overflow-hidden text-sm">
            {children}
          </div>
        </div>
        <div className="basis-0 grow px-9 pb-8 pt-6">{chart}</div>
      </div>
    </section>
  );
};
