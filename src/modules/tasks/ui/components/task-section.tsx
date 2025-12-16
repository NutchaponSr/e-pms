import { InboxIcon, SquareCheckIcon } from "lucide-react";

export const TaskSection = () => {
  return (
    <section className="select-none">
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="contents">
          <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
            <div className="flex items-center justify-center size-4 me-2">
              <SquareCheckIcon className="size-3.5 shrink-0 block text-secondary" />
            </div>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">KPI Bonus</span>
          </div>
        </div>
      </div>

      <div className="grow shrink-0 flex flex-col relative min-h-60 max-h-60 z-1 rounded-lg bg-[#202020e6] shadow-[unset] backdrop-blur-[48px] p-4 start-0">
        {/* <div className="relative h-full max-h-[inherit]">
          <div className="h-full max-h-[inherit] py-2.5 overflow-x-hidden overflow-y-auto">
            <div className="overflow-x-auto overflow-y-hidden px-2">
              <div className="flex flex-col pb-1">

              </div>
            </div>
          </div>
        </div> */}
        <div className="flex grow w-full h-full flex-col justify-center items-center px-[16%] gap-4">
          <InboxIcon className="size-12 text-tertiary stroke-[1.25]" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-tertiary text-center text-balance">
              No upcoming tasks
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}