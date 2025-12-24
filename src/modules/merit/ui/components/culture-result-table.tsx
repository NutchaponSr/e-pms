import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn, formatDecimal } from "@/lib/utils";
import { UseFormReturn, useWatch } from "react-hook-form";
import { MeritEvaluation } from "../../schemas/evaluation";
import { Select, SelectValue, SelectTrigger, SelectItem, SelectContent } from "@/components/ui/select";
import { Period } from "@/generated/prisma/enums";

interface Props {
  index: number;
  form: UseFormReturn<MeritEvaluation>;
  hasChecker: boolean;
  period: Period;
  weight: number;
  data: {
    round: string; 
    result: string | null | undefined;
    owner: number | null | undefined;
    checker: number | null | undefined;
    approver: number | null | undefined;  
    weight: number;
    period: Period;
  }[];
  permissions: {
    canPerformOwner: boolean;
    canPerformChecker: boolean;
    canPerformApprover: boolean;
  };
}

const headers = (hasChecker: boolean) => [
  {
    label: "รอบการประเมิน",
    width: "w-[10%]",
  },
  {
    label: "รายละเอียดจากพนักงาน",
    width: hasChecker ? "w-[60%]" : "w-[70%]",
  },
  {
    label: "Employee",
    width: "w-[10%]",
  },
  {
    label: "Checker",
    width: "w-[10%]",
  },
  {
    label: "Approver",
    width: "w-[10%]",
  },
];

const PERIOD_INFO = {
  [Period.EVALUATION_1ST]: {
    label: "ครั้งที่ 1 (ม.ค. - มิ.ย.)",
    periodIndex: 0,
  },
  [Period.EVALUATION_2ND]: {
    label: "ครั้งที่ 2 (ก.ค. - ธ.ค.)",
    periodIndex: 1,
  },
} as const;

interface LevelSelectCellProps {
  fieldName: `cultures.${number}.${"levelBehaviorOwner" | "levelBehaviorChecker" | "levelBehaviorApprover"}`;
  form: UseFormReturn<MeritEvaluation>;
  levelWeight: number | null;
}

const LevelSelectCell = ({ fieldName, form, levelWeight }: LevelSelectCellProps) => {
  return (
    <div className="flex flex-col gap-2">
      <FormField 
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="grow">
            <Select 
              value={field.value != null ? String(field.value) : ""} 
              onValueChange={(value) => {
                field.onChange(value ? Number(value) : null);
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full rounded-sm">
                  <SelectValue placeholder="เลือก Level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="1">Level 1</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
                <SelectItem value="4">Level 4</SelectItem>
                <SelectItem value="5">Level 5</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-row">
          <div className="whitespace-nowrap overflow-hidden text-ellipsis leading-4.5 min-w-0 text-xs text-secondary">
            Level * Weight
          </div>
        </div>
        <p className="text-sm text-primary whitespace-break-spaces wrap-break-word text-ellipsis text-4.5 overflow-hidden">
          {levelWeight != null ? levelWeight.toFixed(2) : "-"}
        </p>
      </div>
    </div>
  );
};

interface BlankLevelSelectCellProps {
  levelWeight: number | null;
}

export const CultureResultTable = ({
  form,
  index,  
  hasChecker,
  period,
  weight,
  data,
  permissions,
}: Props) => {
  const levelBehaviorOwner = useWatch({
    control: form.control,
    name: `cultures.${index}.levelBehaviorOwner`,
  });

  const levelBehaviorChecker = useWatch({
    control: form.control,
    name: `cultures.${index}.levelBehaviorChecker`,
  });

  const levelBehaviorApprover = useWatch({
    control: form.control,
    name: `cultures.${index}.levelBehaviorApprover`,
  });

  const calculateLevelWeight = (level: number | null) => {
    if (level == null || weight == null) return 0;
    return (level / 5) * weight;
  };

  // For EVALUATION_1ST row: use form values if period === EVALUATION_1ST, otherwise use raw data
  const ownerLevel1st = period === Period.EVALUATION_1ST ? levelBehaviorOwner : (data[0]?.owner ?? null);
  const checkerLevel1st = period === Period.EVALUATION_1ST ? levelBehaviorChecker : (data[0]?.checker ?? null);
  const approverLevel1st = period === Period.EVALUATION_1ST ? levelBehaviorApprover : (data[0]?.approver ?? null);
  
  const ownerLevelWeight1st = calculateLevelWeight(ownerLevel1st);
  const checkerLevelWeight1st = calculateLevelWeight(checkerLevel1st);
  const approverLevelWeight1st = calculateLevelWeight(approverLevel1st);

  // For EVALUATION_2ND row: use raw data if period === EVALUATION_1ST, otherwise use form values
  const ownerLevel2nd = period === Period.EVALUATION_1ST ? (data[1]?.owner ?? null) : levelBehaviorOwner;
  const checkerLevel2nd = period === Period.EVALUATION_1ST ? (data[1]?.checker ?? null) : levelBehaviorChecker;
  const approverLevel2nd = period === Period.EVALUATION_1ST ? (data[1]?.approver ?? null) : levelBehaviorApprover;
  
  const ownerLevelWeight2nd = calculateLevelWeight(ownerLevel2nd);
  const checkerLevelWeight2nd = calculateLevelWeight(checkerLevel2nd);
  const approverLevelWeight2nd = calculateLevelWeight(approverLevel2nd);

  return (
    <table className="w-full border-collapse">
      <thead className="border-[#CAD1DD] dark:border-[#3d587C] border-y">
        <tr>
          {headers(hasChecker).map((header, headerIndex) => (
            <th 
              key={headerIndex} 
              className={cn(
                "text-center px-3 h-8 text-sm font-medium text-primary w-[10%] bg-[#2383e224] border-[#CAD1DD] dark:border-[#3d587C] shadow-none border-r", 
                header.width
              )}
            >
              <div className="flex items-center h-full">
                <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
                  {header.label}
                </div>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-border bg-background even:bg-sidebar">
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            <div className="text-xs text-primary">ครั้งที่ 1 (ม.ค. - มิ.ย.)</div>
          </td>
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            <div className="text-xs text-secondary whitespace-pre-wrap wrap-break-word">
              {period === Period.EVALUATION_1ST && permissions.canPerformOwner ? (
                <FormField 
                  control={form.control}
                  name={`cultures.${index}.result`}
                  render={({ field }) => (
                    <FormItem className="grow">
                      <FormControl>
                        <textarea 
                          {...field}
                          value={field.value ?? ""}
                          className="border bg-background border-border text-primary placeholder:text-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-sm p-2 transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 text-sm focus-visible:border-marine focus-visible:ring-marine/40 focus-visible:ring-[2.5px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {period === Period.EVALUATION_1ST 
                    ? form.getValues(`cultures.${index}.result`) 
                    : data[0]?.result}
                </div>
              )}
            </div>
          </td>
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            {period === Period.EVALUATION_1ST && permissions.canPerformOwner ? (
              <LevelSelectCell
                fieldName={`cultures.${index}.levelBehaviorOwner`}
                form={form}
                levelWeight={ownerLevelWeight1st}
              />
            ) : (
              <div className="text-sm text-muted-foreground">{formatDecimal(ownerLevelWeight1st)}</div>
            )}
          </td>
          {hasChecker && (
            <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
              {period === Period.EVALUATION_1ST && permissions.canPerformChecker ? (
                <LevelSelectCell
                  fieldName={`cultures.${index}.levelBehaviorChecker`}
                  form={form}
                  levelWeight={checkerLevelWeight1st}
                />
              ) : (
                <div className="text-sm text-muted-foreground">{formatDecimal(checkerLevelWeight1st)}</div>
              )}
            </td>
          )}
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            {period === Period.EVALUATION_1ST && permissions.canPerformApprover ? (
              <LevelSelectCell
                fieldName={`cultures.${index}.levelBehaviorApprover`}
                form={form}
                levelWeight={approverLevelWeight1st}
              />
            ) : (
              <div className="text-sm text-muted-foreground">{formatDecimal(approverLevelWeight1st)}</div>
            )}
          </td>
        </tr>
        
        <tr className="border-b border-border bg-background even:bg-sidebar">
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            <div className="text-xs text-primary">ครั้งที่ 2 (ก.ค. - ธ.ค.)</div>
          </td>
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            <div className="text-xs text-secondary whitespace-pre-wrap wrap-break-word">
              {period === Period.EVALUATION_2ND && permissions.canPerformOwner ? (
                <FormField 
                  control={form.control}
                  name={`cultures.${index}.result`}
                  render={({ field }) => (
                    <FormItem className="grow">
                      <FormControl>
                        <textarea 
                          {...field}
                          value={field.value ?? ""}
                          className="border bg-background border-border text-primary placeholder:text-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-sm p-2 transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 text-sm focus-visible:border-marine focus-visible:ring-marine/40 focus-visible:ring-[2.5px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {period === Period.EVALUATION_2ND 
                    ? form.getValues(`cultures.${index}.result`) 
                    : data[1]?.result}
                </div>
              )}
            </div>
          </td>
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            {period === Period.EVALUATION_2ND && permissions.canPerformOwner ? (
              <LevelSelectCell
                fieldName={`cultures.${index}.levelBehaviorOwner`}
                form={form}
                levelWeight={ownerLevelWeight2nd}
              />
            ) : (
              <div className="text-sm text-muted-foreground">{formatDecimal(ownerLevelWeight2nd)}</div>
            )}
          </td>
          {hasChecker && (
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            {period === Period.EVALUATION_2ND && permissions.canPerformChecker ? (
              <LevelSelectCell
                fieldName={`cultures.${index}.levelBehaviorChecker`}
                form={form}
                levelWeight={checkerLevelWeight2nd}
              />
            ) : (
                <div className="text-sm text-muted-foreground">{formatDecimal(checkerLevelWeight2nd)}</div>
              )}
            </td>
          )}
          <td className="align-top px-3 py-2 dark:last:border-none last:shadow-none border-r border-border">
            {period === Period.EVALUATION_2ND && permissions.canPerformApprover ? (
              <LevelSelectCell
                fieldName={`cultures.${index}.levelBehaviorApprover`}
                form={form}
                levelWeight={approverLevelWeight2nd}
              />
            ) : (
              <div className="text-sm text-muted-foreground">{formatDecimal(approverLevelWeight2nd)}</div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

