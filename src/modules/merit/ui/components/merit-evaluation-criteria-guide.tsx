interface Level {
  label: string;
  content: string;
}

interface Props {
  title?: string;
  description?: string;
  levels: Level[];
}

export const MeritEvaluationCriteriaGuide = ({
  title,
  description,
  levels
}: Props) => {
  return (
    <div className="pb-4">
      <div className="overflow-hidden text-xs bg-sidebar shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.086)] dark:shadow-[inset_0_0_0_1.25px_#ffffff0d] dark:hover:shadow-[inset_0_0_0_1.25px_#ffffff1a] rounded-sm h-full">
        <div className="flex items-center gap-2 bg-marine py-1 px-2">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
        </div>
        <div className="grid grid-cols-3">
          <div className="flex items-center px-2.5 py-2 border-e dark:border-white/10">
            <div className="max-w-full w-full whitespace-break-spaces [word-break:break-word] text-primary text-xs leading-4.5 h-full">
              {description}
            </div>
          </div>
          <div className="col-span-2 flex flex-col">
            <h4 className="text-center text-sm font-semibold text-primary py-2 px-2">
              ระดับความสำเร็จ (Achievement Level)
            </h4>
            <div className="flex items-stretch px-2 pb-2">
              {levels.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-1 flex-col items-center p-1 space-y-2 rounded"
                >
                  <div className="inline-flex items-center justify-center shrink-0 size-6 rounded-full text-xs font-medium dark:text-blue-neutral text-blue-muted bg-[#0063ae2c] dark:bg-[#3b98ff62]">
                    {item.label}
                  </div>
                  <div className="min-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow px-px text-xs text-primary text-center">
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
