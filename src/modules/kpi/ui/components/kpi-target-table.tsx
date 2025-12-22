"use client"

import { UseFormReturn } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { KpisEvaluation } from "../../schema/evaluation";

interface AchievementRadioCellProps {
  id: string;
  value: string;
  checked: boolean;
  disabled: boolean;
  onValueChange: (value: string) => void;
  borderColor?: "border" | "foreground";
}

const AchievementRadioCell = ({
  id,
  value,
  checked,
  disabled,
  onValueChange,
  borderColor = "border",
}: AchievementRadioCellProps) => {
  return (
    <div className="flex items-center justify-center">
      <RadioGroup
        className="items-center"
        value={checked ? value : ""}
        disabled={disabled}
        onValueChange={onValueChange}
      >
        <RadioGroupItem
          id={id}
          value={value}
          aria-label={id}
          className="sr-only"
          disabled={disabled}
        />
        <label
          htmlFor={id}
          className={cn(
            "size-5 rounded-xs border grid place-items-center cursor-pointer bg-background",
            borderColor === "border" ? "border-border" : "border-foreground",
            checked && "bg-marine text-white border-marine",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <CheckIcon className={cn("size-4", checked ? "opacity-100" : "opacity-0")} />
        </label>
      </RadioGroup>
    </div>
  );
};

interface TargetRow {
  id: string;
  title: string;
  detail: string | null;
}

interface KpiTargetTableProps {
  targets: TargetRow[];
  index: number;
  form: UseFormReturn<KpisEvaluation>;
  hasChecker: boolean;
  year: number;
  canPerformOwner: boolean;
  canPerformChecker: boolean;
  canPerformApprover: boolean;
  achievementOwner: number | null;
  achievementChecker: number | null;
  achievementApprover: number | null;
}

const TableHeader = ({ hasChecker }: { hasChecker: boolean }) => (
  <thead>
    <tr className="bg-background border-b border-border">
      <th className="text-left p-3 text-sm font-medium text-primary w-[10%]">
        Success Target Range
      </th>
      <th className="text-left p-3 text-sm font-medium text-primary" style={{ width: hasChecker ? "60%" : "70%" }}>
        Target Detail
      </th>
      <th className="text-center p-3 text-sm font-medium text-primary w-[10%]">
        Owner
      </th>
      {hasChecker && (
        <th className="text-center p-3 text-sm font-medium text-primary w-[10%]">
          Checker
        </th>
      )}
      <th className="text-center p-3 text-sm font-medium text-primary w-[10%]">
        Approver
      </th>
    </tr>
  </thead>
);

const TableFooter = ({ hasChecker }: { hasChecker: boolean }) => (
  <tfoot>
    <tr className="bg-background border-t border-border">
      <td colSpan={2} className="p-3">
        <div className="flex items-center justify-end overflow-hidden whitespace-nowrap">
          <div className="flex items-center">
            <span className="font-medium text-tertiary text-[10px] uppercase tracking-[1px] me-1 select-none mt-px">
              % Success Weight
            </span>
          </div>
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center justify-end overflow-hidden whitespace-nowrap">
          <div className="flex items-center">
            <span className="font-medium text-tertiary text-[10px] uppercase tracking-[1px] me-1 select-none mt-px">
              Value
            </span>
          </div>
        </div>
      </td>
      {hasChecker && (
        <td className="p-3">
          <div className="flex items-center justify-end overflow-hidden whitespace-nowrap">
            <div className="flex items-center">
              <span className="font-medium text-tertiary text-[10px] uppercase tracking-[1px] me-1 select-none mt-px">
                Value
              </span>
            </div>
          </div>
        </td>
      )}
      <td className="p-3">
        <div className="flex items-center justify-end overflow-hidden whitespace-nowrap">
          <div className="flex items-center">
            <span className="font-medium text-tertiary text-[10px] uppercase tracking-[1px] me-1 select-none mt-px">
              Value
            </span>
          </div>
        </div>
      </td>
    </tr>
  </tfoot>
);

export const KpiTargetTable = ({
  targets,
  index,
  form,
  hasChecker,
  year,
  canPerformOwner,
  canPerformChecker,
  canPerformApprover,
  achievementOwner,
  achievementChecker,
  achievementApprover,
}: KpiTargetTableProps) => {
  const getValue = (rowId: string) => {
    if (rowId === "120") return 120;
    return year >= 2025 ? Number(rowId) + 10 : Number(rowId);
  };

  const handleValueChange = (field: "achievementOwner" | "achievementChecker" | "achievementApprover", value: string) => {
    form.setValue(`kpis.${index}.${field}`, value ? Number.parseFloat(value) : null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="w-full border border-border rounded-sm overflow-hidden">
      <table className="w-full border-collapse">
        <TableHeader hasChecker={hasChecker} />
        <tbody>
          {targets.map((row) => {
            const value = getValue(row.id);
            const valueStr = value.toString();

            const ownerId = `owner-${index}-${value}`;
            const ownerChecked = achievementOwner != null && achievementOwner.toString() === valueStr;

            const checkerId = `checker-${index}-${value}`;
            const checkerChecked = achievementChecker != null && achievementChecker.toString() === valueStr;

            const approverId = `approver-${index}-${value}`;
            const approverChecked = achievementApprover != null && achievementApprover.toString() === valueStr;

            return (
              <tr key={row.id} className="border-b border-border hover:bg-background/50">
                <td className="p-3">
                  <div className="text-sm text-primary">{row.title}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-start">
                    <div className="text-sm text-secondary whitespace-pre-wrap wrap-break-word">
                      {row.detail}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <AchievementRadioCell
                    id={ownerId}
                    value={valueStr}
                    checked={ownerChecked}
                    disabled={!canPerformOwner}
                    onValueChange={(v) => handleValueChange("achievementOwner", v)}
                  />
                </td>
                {hasChecker && (
                  <td className="p-3">
                    <AchievementRadioCell
                      id={checkerId}
                      value={valueStr}
                      checked={checkerChecked}
                      disabled={!canPerformChecker}
                      onValueChange={(v) => handleValueChange("achievementChecker", v)}
                      borderColor="foreground"
                    />
                  </td>
                )}
                <td className="p-3">
                  <AchievementRadioCell
                    id={approverId}
                    value={valueStr}
                    checked={approverChecked}
                    disabled={!canPerformApprover}
                    onValueChange={(v) => handleValueChange("achievementApprover", v)}
                    borderColor="foreground"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <TableFooter hasChecker={hasChecker} />
      </table>
    </div>
  );
};

