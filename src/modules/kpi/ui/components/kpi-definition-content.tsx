import { KpiDefinition, KpiDefinitions } from "@/modules/kpi/schema/definition";
import { UseFormReturn } from "react-hook-form";

import { Period } from "@/generated/prisma/enums";
import { CommentWithEmployee } from "@/modules/comments/types";
import { Action } from "@/modules/tasks/permissions";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { kpiCategoies } from "../../constants";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDeleteKpi } from "../../api/use-delete-kpi";
import { useConfirm } from "@/hooks/use-confirm";

interface Props {
  kpi: KpiDefinition;
  index: number;
  period: Period;
  formId: string;
  form: UseFormReturn<KpiDefinitions>;
  comments: CommentWithEmployee[];
  permissions: Record<Action, boolean>;
}

const header = cva("h-8 border-r border-border bg-sidebar shadow-[inset_0_1.25px_0_rgba(42,28,0,0.07),inset_0_-1.25px_0_rgba(42,28,0,0.07)] dark:shadow-[inset_0_1.25px_0_rgba(255,255,243,0.082),inset_0_-1.25px_0_rgba(255,255,243,0.082)] px-2");

export const KpiDefinitionContent = ({ index, form, ...props }: Props) => {
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "Delete KPI",
    description: "Are you sure you want to delete this KPI?",
  });

  const { mutation: deleteKpi } = useDeleteKpi(props.formId, props.period);

  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const targetRanges = [
    "< 70%",
    "> 70% <= 80%",
    "> 80% <= 90%",
    "> 90% <= 100%",
    "100%",
  ];

  const detailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const updateHeights = () => {
      const heights = detailRefs.current.map((ref) => {
        if (!ref) return 81; // Default min height
        // offsetHeight already includes padding and border
        return ref.offsetHeight;
      });
      setRowHeights(heights);
    }

    // Initial update with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      updateHeights();
    }, 0);

    // Use requestAnimationFrame for immediate update after render
    const rafId = requestAnimationFrame(() => {
      updateHeights();
    });

    const observers: ResizeObserver[] = [];
    detailRefs.current.forEach((ref) => {
      if (ref) {
        const observer = new ResizeObserver(() => {
          updateHeights();
        });
        observer.observe(ref);
        observers.push(observer);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const onDelete = async () => {
    const ok = await confirm();

    if (ok) {
      deleteKpi({ id: props.kpi.id });
    }
  }

  return (
    <div className="mt-0 min-w-full border-b relative overflow-hidden">
      <ConfirmationDialog />
      <div className="grid grid-cols-[1fr_100px_160px_1fr] divide-x divide-border">
        <div className={cn(header())}>
          <div className="flex items-center h-full gap-2">
            <Badge color="orange" label={(index + 1).toString()} />
            <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis text-start grow">
              Kpi Details
            </div>
            <Button type="button" variant="dangerOutline" size="xxs" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
        <div className={cn(header())}>
          <div className="flex items-center h-full">
            <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
              Weight
            </div>
          </div>
        </div>
        <div className={cn(header())}>
          <div className="flex items-center h-full">
            <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
              Target Range
            </div>
          </div>
        </div>
        <div className={cn("border-none", header())}>
          <div className="flex items-center h-full">
            <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
              Target Detail
            </div>
          </div>
        </div>

        <div className="p-2 overflow-hidden">
          <div className="flex flex-col gap-2">
            <FormField 
              control={form.control}
              name={`kpis.${index}.category`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Individual KPI</FormLabel>
                  <Select>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an individual KPI" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(kpiCategoies).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField 
              control={form.control}
              name={`kpis.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">ตัวชี้วัดการดำเนินงานหลัก</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField 
              control={form.control}
              name={`kpis.${index}.definition`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">ความหมายและสูตรคำนวณ</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>  
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField 
              control={form.control}
              name={`kpis.${index}.method`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">แหล่งข้อมูลที่ใช้วัดผลลัพธ์</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="p-2">
          <FormField 
            control={form.control}
            name={`kpis.${index}.weight`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Weight</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    type="number"
                    min={0}
                    max={100}
                    className="text-xs"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col divide-y divide-border">
          {targetRanges.map((item, rangeIndex) => (
            <div 
              key={rangeIndex}
              className="flex items-center justify-center p-3"
              style={{ 
                height: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "auto",
                minHeight: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "81px"
              }}
            >
              <span className="text-sm font-medium font-mono">{item}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col divide-y divide-border">
          <div ref={(el) => { detailRefs.current[0] = el }} className="p-2">
            <FormField 
              control={form.control}
              name={`kpis.${index}.target60`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value ?? ""}  
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div ref={(el) => { detailRefs.current[1] = el }} className="p-2">
            <FormField 
              control={form.control}
              name={`kpis.${index}.target70`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value ?? ""}  
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div ref={(el) => { detailRefs.current[2] = el }} className="p-2">
            <FormField 
              control={form.control}
              name={`kpis.${index}.target80`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value ?? ""}  
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div ref={(el) => { detailRefs.current[3] = el }} className="p-2">
            <FormField 
              control={form.control}
              name={`kpis.${index}.target90`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value ?? ""}  
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div ref={(el) => { detailRefs.current[4] = el }} className="p-2">
            <FormField 
              control={form.control}
              name={`kpis.${index}.target100`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value ?? ""}  
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
