import { InboxIcon } from "lucide-react";

interface Props {
  children: React.ReactNode;
  hasSomeTask: boolean;
}

export const TaskList = ({ children, hasSomeTask }: Props) => {
  return (
    <div className="flex flex-col relative max-h-60 rounded-sm bg-white/6 dark:bg-[#202020e6] shadow-[0_12px_32px_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.089)] dark:shadow-[unset]">
        {hasSomeTask ? (
          <div className="h-full max-h-60 py-2 overflow-x-hidden overflow-y-auto">
            <div className="px-2 overflow-x-auto overflow-y-hidden me-0 mb-0">
              <div className="flex flex-col gap-px">
                {children}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-[calc(100%-4px)] py-8 flex flex-col items-center justify-center text-center text-sm text-tertiary gap-4 font-medium tracking-wide">
            <InboxIcon className="size-8 stroke-[1.1]" />
            No matching tasks
          </div>
        )}
      </div>
  );
}