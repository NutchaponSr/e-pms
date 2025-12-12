interface Props {
  dueDate: string;
  title: string;
  description: string;
}

export const Event = ({ dueDate, title, description }: Props) => {
  return (
    <div className="flex flex-row pb-2.5 last:pb-0">
      <div className="w-1/5 pe-2.5 flex flex-col text-xs font-medium">
        {dueDate}
      </div>
      <div className="w-4/5">
        <div className="mb-3.5 flex">
          <div className="flex w-full gap-1 overflow-hidden">
            <div className="w-1 rounded bg-[#2f2f2f] shrink-0" />
            <div className="flex flex-col">
              <div className="flex flex-col grow shrink ps-2.5 overflow-hidden">
                <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">Team standup</span>
                <span className="text-xs">{description}</span>
              </div>
              <div className="mt-1.5 ps-2.5">
                <button className="w-fit pt-0.5 px-2 flex flex-row bg-[#252525] rounded items-center min-h-6 hover:bg-[#2f2f2f]">
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}