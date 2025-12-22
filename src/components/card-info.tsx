import { cn } from "@/lib/utils";

export const CardInfo = ({ children, label, className }: { children: React.ReactNode, label: string, className?: string }) => {
  return (
    <div className={cn("grow-0 shrink-0 basis-auto p-2 box-content h-max rounded-sm bg-[#0080d50c] dark:bg-[#298bfd10]", className)}>
      <div className="flex flex-col gap-1.5 h-full">
        <h3 className="text-sm font-medium text-marine">
          {label}
        </h3>
        <div className="shadow-[0_4px_12px_0_rgba(25,25,25,0.029),0_1px_2px_0_rgba(25,25,25,0.019),0_0_0_1px_rgba(0,124,215,0.094)] dark:shadow-[0_4px_12px_0_rgba(25,25,25,0.4),0_0_0_1px_rgba(71,157,255,0.173)] rounded overflow-hidden grow h-auto bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}