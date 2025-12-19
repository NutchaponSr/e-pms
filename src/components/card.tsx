import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: Props) => {
  return (
    <div className={cn("top-0 start-0 w-full translate-y-0", className)}>
      <div className="contents">
        <div className="relative p-4 bg-[#202020] dark:shadow-[inset_0_0_0_1.25px_#ffffff0d] dark:hover:shadow-[inset_0_0_0_1.25px_#ffffff1a] rounded-sm">
          {children}
        </div>
      </div>
    </div>
  );
}