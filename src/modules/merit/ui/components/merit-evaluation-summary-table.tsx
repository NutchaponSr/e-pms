"use client";

import { NumberTicker } from "@/components/number-ticker";
import { cn, formatDecimal } from "@/lib/utils";

interface RoleScores {
  competency: number;
  culture: number;
}

interface Props {
  hasChecker: boolean;
  competencyFull: number;
  cultureFull: number;
  scores: {
    owner: RoleScores;
    checker: RoleScores;
    approver: RoleScores;
  };
}

const SCORE_CLASS = "tabular-nums text-xs font-semibold text-primary";

function ScoreCell({ value }: { value: number }) {
  return (
    <NumberTicker value={value} decimalPlaces={2} className={SCORE_CLASS} />
  );
}

export const MeritEvaluationSummaryTable = ({
  hasChecker,
  competencyFull,
  cultureFull,
  scores,
}: Props) => {
  const evaluatorColumns = hasChecker
    ? ([
        { key: "owner" as const, label: "Employee", scores: scores.owner },
        { key: "checker" as const, label: "Evaluator 1", scores: scores.checker },
        { key: "approver" as const, label: "Evaluator 2", scores: scores.approver },
      ] as const)
    : ([
        { key: "owner" as const, label: "Employee", scores: scores.owner },
        { key: "approver" as const, label: "Evaluator 2", scores: scores.approver },
      ] as const);

  const rows = [
    {
      label: "COMPETENCY",
      full: competencyFull,
      getScore: (role: RoleScores) => role.competency,
    },
    {
      label: "CULTURE",
      full: cultureFull,
      getScore: (role: RoleScores) => role.culture,
    },
  ] as const;

  return (
    <div className="w-full min-w-[min(100%,18rem)]">
      <div className="overflow-hidden rounded border border-border/80 bg-background text-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-[#2383e218] dark:bg-[#298bfd14]">
              <th
                rowSpan={2}
                className="border-r border-border/70 px-2 py-1 text-left align-middle font-medium text-secondary"
              >
                Category
              </th>
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
                Overall Evaluation
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
            {rows.map((row, rowIndex) => (
              <tr
                key={row.label}
                className={rowIndex < rows.length - 1 ? "border-b border-border/70" : undefined}
              >
                <td className="border-r border-border/70 px-2 py-1 font-semibold text-marine">
                  {row.label}
                </td>
                <td className="border-r border-border/70 px-2 py-1 text-center tabular-nums text-secondary">
                  {formatDecimal(row.full, 0)}
                </td>
                {evaluatorColumns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-2 py-1 text-center",
                      colIndex < evaluatorColumns.length - 1 && "border-r border-border/60",
                    )}
                  >
                    <ScoreCell value={row.getScore(col.scores)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
