import Link from "next/link";

import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export const ApplicationCard = ({
  title,
  href,
  description,
  icon: Icon,
}: Props) => {
  return (
    <div className="relative w-full flex group">
      <Link href={href} className="flex text-inherit select-none transition cursor-pointer relative rounded-md flex-col overflow-hidden w-full h-auto bg-[#ffffff0d] grow shrink basis-0">
        <div className="relative rounded-t-md transition">
          <div className="h-16 bg-foreground border-b border-border rounded-t-md" />
          <div className="absolute top-[30px] start-4">
            <div className="bg-background rounded-full shadow-none outline-1 outline-[#fffff315] -outline-offset-1">
              <div className="rounded-full size-16 flex justify-center items-center select-none">
                <Icon className="size-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
        <div className="relative p-4">
          <div className="flex flex-col gap-0.5 h-full">
            <div className="pt-7 flex items-center gap-1.5">
              <h4 className="text-sm leading-5 font-medium">{title}</h4>
            </div>
            <div className="flex flex-col gap-3 pt-2.5">
              <div className="h-12 max-h-12">
                <p className="text-xs leading-4 text-tertiary font-normal">{description}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute pointer-events-none rounded-md inset-0 z-1 shadow-unset group-hover:shadow-[inset_0_0_0_1.25px_#ffffff0d]" />
    </div>
  );
}