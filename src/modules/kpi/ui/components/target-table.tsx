"use client"

import { UseFormReturn } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, formatDecimal } from "@/lib/utils";
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
  weight: number;
  canPerformOwner: boolean;
  canPerformChecker: boolean;
  canPerformApprover: boolean;
  achievementOwner: number | null;
  achievementChecker: number | null;
  achievementApprover: number | null;
}

const TableHeader = ({ hasChecker }: { hasChecker: boolean }) => (
  <thead className="border-[#CAD1DD] dark:border-[#3d587C] border-y">
    <tr>
      <th className="text-left px-3 h-8 text-sm font-medium text-primary w-[12%] bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none border-r">
        <div className="flex items-center h-full">
          <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
            Success Target Range
          </div>
        </div>
      </th>
      <th className="text-left px-3 h-8 text-sm font-medium text-primary bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none border-r" style={{ width: hasChecker ? "58%" : "68%" }}>
        <div className="flex items-center h-full">
          <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
            Target Detail
          </div>
        </div>
      </th>
      <th className="text-center px-3 h-8 text-sm font-medium text-primary w-[10%] bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none border-r">
        <div className="flex items-center h-full">
          <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
            Owner
          </div>
        </div>
      </th>
      {hasChecker && (
        <th className="text-center px-3 h-8 text-sm font-medium text-primary w-[10%] bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none border-r">
          <div className="flex items-center h-full">
            <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
              Checker
            </div>
          </div>
        </th>
      )}
      <th className="text-center px-3 h-8 text-sm font-medium text-primary w-[10%] bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none">
        <div className="flex items-center h-full">
          <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
            Approver
          </div>
        </div>
      </th>
    </tr>
  </thead>
);

const TableFooter = ({ 
  hasChecker, 
  achievementOwner, 
  achievementChecker, 
  achievementApprover,
  weight,
}: { 
  hasChecker: boolean;
  achievementOwner: number | null;
  achievementChecker: number | null;
  achievementApprover: number | null;
  weight: number;
}) => (
  <tfoot className="border-[#CAD1DD] dark:border-[#3d587C] border-y">
    <tr>
      <td colSpan={2} className="text-center px-3 h-8 text-sm font-medium bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none border-r">
        <div className="flex items-center justify-end overflow-hidden whitespace-nowrap">
          <div className="flex items-center">
            <span className="font-medium text-secondary text-[10px] uppercase tracking-[1px] me-1 select-none mt-px">
              % Success Weight
            </span>
          </div>
        </div>
      </td>
      <td className="text-center px-3 h-8 text-sm font-medium bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none border-r">
        <div className="flex items-center justify-end overflow-hidden whitespace-nowrap">
          <div className="flex items-center">
            <span className="font-medium text-secondary text-[10px] uppercase tracking-[1px] me-1 select-none mt-px">
              Value
            </span>
            <span className="text-sm">
              {formatDecimal(Number(achievementOwner) / 100 * weight)} %
            </span>
          </div>
        </div>
      </td>
      {hasChecker && (
        <td className="text-center px-3 h-8 text-sm font-medium bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none border-r">
          <div className="flex items-center justify-end overflow-hidden whitespace-nowrap">
            <div className="flex items-center">
              <span className="font-medium text-secondary text-[10px] uppercase tracking-[1px] me-1 select-none mt-px">
                Value
              </span>
              <span className="text-sm">
                {formatDecimal(Number(achievementChecker) / 100 * weight)} %
              </span>
            </div>
          </div>
        </td>
      )}
      <td className="text-center px-3 h-8 text-sm font-medium bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none">
        <div className="flex items-center justify-end overflow-hidden whitespace-nowrap">
          <div className="flex items-center">
            <span className="font-medium text-secondary text-[10px] uppercase tracking-[1px] me-1 select-none mt-px">
              Value
            </span>
            <span className="text-sm">
              {formatDecimal(Number(achievementApprover) / 100 * weight)} %
            </span>
          </div>
        </div>
      </td>
    </tr>
  </tfoot>
);

export const TargetTable = ({
  targets,
  index,
  form,
  hasChecker,
  year,
  weight,
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
    <div className="w-full overflow-hidden">
      <table className="mt-0 table-fixed border-collapse min-w-full">
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
              <tr key={row.id} className="border-b border-border bg-background even:bg-sidebar">
                <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
                  <div className="text-sm text-primary">{row.title}</div>
                </td>
                <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
                  <div className="flex items-center justify-start">
                    <div className="text-xs text-secondary whitespace-pre-wrap wrap-break-word">
                      {row.detail}
                    </div>
                  </div>
                </td>
                <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
                  <AchievementRadioCell
                    id={ownerId}
                    value={valueStr}
                    checked={ownerChecked}
                    disabled={!canPerformOwner}
                    onValueChange={(v) => handleValueChange("achievementOwner", v)}
                  />
                </td>
                {hasChecker && (
                  <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
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
                <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
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
        <TableFooter 
          hasChecker={hasChecker} 
          achievementOwner={achievementOwner} 
          achievementChecker={achievementChecker} 
          achievementApprover={achievementApprover} 
          weight={weight} 
        />
      </table>
    </div>
  );
};

