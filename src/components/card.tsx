import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: Props) => {
  return (
    <div className={cn("top-0 start-0 w-full translate-y-0 my-0.5", className)}>
      <div className="contents">
        <div className="relative p-4 bg-sidebar shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.086)] dark:shadow-[inset_0_0_0_1.25px_#ffffff0d] dark:hover:shadow-[inset_0_0_0_1.25px_#ffffff1a] rounded-sm h-full">
          {children}
        </div>
      </div>
    </div>
  );
}