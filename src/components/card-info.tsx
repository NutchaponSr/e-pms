import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const cardVariants = cva("", {
  variants: {
    card: {
      default: "bg-[#0080d50c] dark:bg-[#298bfd10]",
      gray: "dark:bg-[#fcfcfc08]"
    },
    label: {
      default: "text-marine",
      gray: "text-[#bcbab6]"
    },
    content: {
      default: "shadow-[0_4px_12px_0_rgba(25,25,25,0.029),0_1px_2px_0_rgba(25,25,25,0.019),0_0_0_1px_rgba(0,124,215,0.094)] dark:shadow-[0_4px_12px_0_rgba(25,25,25,0.4),0_0_0_1px_rgba(71,157,255,0.173)] bg-[#202020]",
      gray: "dark:shadow-[0_0_0_1px_rgba(188,186,182,0.1)] bg-[#202020]"
    },
  },
});

interface Props {
  children: React.ReactNode;
  label: string;
  className?: string;
  variant: "default" | "gray";
}

export const CardInfo = ({ 
  children, 
  label, 
  className,
  variant
}: Props) => {
  return (
    <div className={cn(cardVariants({ card: variant }), 
      "grow-0 shrink-0 basis-auto p-2 h-full rounded-sm", 
      className)}
    >
      <div className="flex flex-col gap-2 h-full">
        <h3 className={cn(
          cardVariants({ label: variant }),
          "text-sm font-medium"
        )}>
          {label}
        </h3>
        <div className={cn(
          cardVariants({ content: variant }),
          "rounded overflow-hidden grow h-auto"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}