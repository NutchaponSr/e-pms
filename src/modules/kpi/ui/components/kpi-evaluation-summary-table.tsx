"use client";

import { NumberTicker } from "@/components/number-ticker";
import { cn, formatDecimal } from "@/lib/utils";

interface Props {
  hasChecker: boolean;
  full: number;
  scores: {
    owner: number;
    checker: number;
    approver: number;
  };
}

const SCORE_CLASS = "tabular-nums text-xs font-semibold text-primary";

export const KpiEvaluationSummaryTable = ({ hasChecker, full, scores }: Props) => {
  const evaluatorColumns = hasChecker
    ? ([
        { key: "owner" as const, label: "Employee", value: scores.owner },
        { key: "checker" as const, label: "Evaluator 1", value: scores.checker },
        { key: "approver" as const, label: "Evaluator 2", value: scores.approver },
      ] as const)
    : ([
        { key: "owner" as const, label: "Employee", value: scores.owner },
        { key: "approver" as const, label: "Evaluator 2", value: scores.approver },
      ] as const);

  return (
    <div className="w-full min-w-[min(100%,16rem)]">
      <div className="overflow-hidden rounded border border-border/80 bg-background text-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-[#2383e218] dark:bg-[#298bfd14]">
              <th
                rowSpan={2}
                className="border-r border-border/70 px-2 py-1 text-center align-middle font-medium text-secondary"
              >
                Full
              </th>
              <th
                colSpan={evaluatorColumns.length}
                className="border-b border-border/60 px-2 py-0.5 text-center text-[11px] font-semibold text-marine"
              >
                Year-End Evaluation
              </th>
            </tr>
            <tr className="border-b border-border bg-[#2383e210] dark:bg-[#298bfd0c]">
              {evaluatorColumns.map((col, colIndex) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-2 py-1 text-center font-medium text-secondary",
                    colIndex < evaluatorColumns.length - 1 && "border-r border-border/60",
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-border/70 px-2 py-1.5 text-center tabular-nums font-semibold text-primary">
                {formatDecimal(full, 2)}
              </td>
              {evaluatorColumns.map((col, colIndex) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-2 py-1.5 text-center",
                    colIndex < evaluatorColumns.length - 1 && "border-r border-border/60",
                  )}
                >
                  <NumberTicker value={col.value} decimalPlaces={2} className={SCORE_CLASS} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
