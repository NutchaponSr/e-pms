import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

export const EventSection = ({
  icon: Icon,
  title,
  children,
}: Props) => {
  return (
    <section>
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="contents">
          <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
            <div className="flex items-center justify-center size-4 me-2">
              <Icon className="size-3.5 shrink-0 block text-secondary" />
            </div>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
              {title}
            </span>
          </div>
        </div>
      </div>
      <div className="px-0 z-1 relative flex flex-col rounded-lg bg-[#202020e6] shadow-[unset] backdrop-blur-[48px] min-h-0 max-h-[270px] py-0">
        <div className="basis-0 grow px-9 py-8">
          <div className="flex flex-col justify-center min-h-full text-tertiary overflow-hidden text-sm">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}