import * as React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { KpiDefinition, KpiDefinitions } from "../../schema/definition";
import { UseFormReturn } from "react-hook-form";
import { InputField } from "@/components/input-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { kpiCategoies } from "../../constants";
import { TargetIcon } from "lucide-react";
import { CommentSection } from "@/components/comment-section";
import { Separator } from "@/components/ui/separator";

interface Props {
  kpi: KpiDefinition;
  index: number;
  form: UseFormReturn<KpiDefinitions>;
}

export const KpiDefinitionContent = ({ kpi, index, form }: Props) => {
  const objectiveRef = React.useRef<HTMLTextAreaElement | null>(null);
  const definitionRef = React.useRef<HTMLTextAreaElement | null>(null);
  const methodRef = React.useRef<HTMLTextAreaElement | null>(null);
  const target70Ref = React.useRef<HTMLTextAreaElement | null>(null);
  const target80Ref = React.useRef<HTMLTextAreaElement | null>(null);
  const target90Ref = React.useRef<HTMLTextAreaElement | null>(null);
  const target100Ref = React.useRef<HTMLTextAreaElement | null>(null);
  const target120Ref = React.useRef<HTMLTextAreaElement | null>(null);

  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  };

  const isLg = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(min-width: 1024px)").matches;

  const isMd = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(min-width: 768px)").matches;

  const syncTextareaHeights = () => {
    const els = [objectiveRef.current, definitionRef.current, methodRef.current].filter(
      Boolean
    ) as HTMLTextAreaElement[];
    if (els.length === 0) return;

    if (!isLg()) {
      for (const el of els) autoResizeTextarea(el);
      return;
    }

    // Reset height first so scrollHeight is accurate, then set all to max.
    for (const el of els) el.style.height = "0px";
    const max = Math.max(...els.map((el) => el.scrollHeight));
    for (const el of els) el.style.height = `${max}px`;
  };

  const syncTargetTextareaHeights = () => {
    const els = [
      target70Ref.current,
      target80Ref.current,
      target90Ref.current,
      target100Ref.current,
      target120Ref.current,
    ].filter(Boolean) as HTMLTextAreaElement[];
    if (els.length === 0) return;

    if (!isMd()) {
      for (const el of els) autoResizeTextarea(el);
      return;
    }

    for (const el of els) el.style.height = "0px";
    const max = Math.max(...els.map((el) => el.scrollHeight));
    for (const el of els) el.style.height = `${max}px`;
  };

  React.useEffect(() => {
    // Initial sync (covers initial values + first render)
    syncTextareaHeights();
    syncTargetTextareaHeights();

    const mq = window.matchMedia?.("(min-width: 1024px)");
    const mqMd = window.matchMedia?.("(min-width: 768px)");
    const onChange = () => syncTextareaHeights();
    const onChangeMd = () => syncTargetTextareaHeights();
    const onResize = () => syncTextareaHeights();
    const onResizeMd = () => syncTargetTextareaHeights();

    mq?.addEventListener?.("change", onChange);
    mqMd?.addEventListener?.("change", onChangeMd);
    window.addEventListener("resize", onResize);
    window.addEventListener("resize", onResizeMd);

    return () => {
      mq?.removeEventListener?.("change", onChange);
      mqMd?.removeEventListener?.("change", onChangeMd);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResizeMd);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center grow gap-2"> 
        <div className="shrink-0 grow-0 self-start mt-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
          <div className="text-white text-xl font-semibold">
            {index + 1}
          </div>
        </div>
        <FormField
          control={form.control}
          name={`kpis.${index}.name`}
          render={({ field }) => (
            <FormItem className="grow">
              <FormControl>
                <textarea 
                  rows={1}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="KPI's Name"
                  className="max-w-full w-full whitespace-pre-wrap wrap-break-word p-0.5 -m-0.5 leading-9 overflow-hidden focus-visible:outline-none resize-none h-full field-sizing-content break-all text-2xl font-bold cursor-text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid lg:grid-cols-4 grid-cols-2 gap-2 overflow-hidden">
        <FormField 
          control={form.control}
          name={`kpis.${index}.category`}
          render={({ field }) => (
            <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
              <FormLabel className="whitespace-nowrap text-sm text-marine">Category</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange}>
                  <SelectTrigger className="w-full dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] min-h-10 bg-[#202020] hover:bg-[#213041] transition text-primary data-placeholder:text-marine border-none">
                    <SelectValue placeholder="Select a Category" />
                  </SelectTrigger>
                  <SelectContent align="center" side="bottom">
                    {Object.entries(kpiCategoies).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField 
          control={form.control}
          name={`kpis.${index}.weight`}
          render={({ field }) => (
            <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
              <FormLabel className="whitespace-nowrap text-sm text-marine">Weight</FormLabel>
              <FormControl>
                <input 
                  type="number"
                  className="inline-flex items-center gap-2 rounded-sm px-2.5 whitespace-nowrap text-sm leading-tight w-full dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] min-h-10 bg-[#202020] hover:bg-[#253649] transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-0"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField 
          control={form.control}
          name={`kpis.${index}.strategy`}
          render={({ field }) => (
            <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
              <FormLabel className="whitespace-nowrap text-sm text-marine">Strategy</FormLabel>
              <FormControl>
                <input 
                  type="text"
                  className="inline-flex items-center gap-2 rounded-sm px-2.5 whitespace-nowrap text-sm leading-tight w-full dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] min-h-10 bg-[#202020] hover:bg-[#253649] transition text-primary focus:outline-none focus:ring-0 data-[type=false]:text-primary"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField 
          control={form.control}
          name={`kpis.${index}.type`}
          render={({ field }) => (
            <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
              <FormLabel className="whitespace-nowrap text-sm text-marine">KPI's Type</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange}>
                  <SelectTrigger className="w-full dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] min-h-10 bg-[#202020] hover:bg-[#213041] transition text-primary data-placeholder:text-marine border-none">
                    <SelectValue placeholder="Select a KPI's Type" />
                  </SelectTrigger>
                  <SelectContent align="center" side="bottom">
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid lg:grid-cols-3 grid-cols-1 gap-2 overflow-hidden">
        <FormField 
          control={form.control}
          name={`kpis.${index}.objective`}
          render={({ field }) => (
            <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-fit dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
              <FormLabel className="whitespace-nowrap text-sm text-marine">Objective</FormLabel>
              <FormControl>
                <textarea 
                  {...field}
                  value={field.value ?? ""}
                  rows={1}
                  ref={(el) => {
                    objectiveRef.current = el;
                    field.ref(el);
                    syncTextareaHeights();
                  }}
                  onInput={() => syncTextareaHeights()}
                  className="w-full rounded-sm p-2.5 text-sm leading-tight dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField 
          control={form.control}
          name={`kpis.${index}.definition`}
          render={({ field }) => (
            <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
              <FormLabel className="whitespace-nowrap text-sm text-marine">Definition</FormLabel>
              <FormControl>
                <textarea 
                  {...field}
                  value={field.value ?? ""}
                  rows={1}
                  ref={(el) => {
                    definitionRef.current = el;
                    field.ref(el);
                    syncTextareaHeights();
                  }}
                  onInput={() => syncTextareaHeights()}
                  className="w-full rounded-sm p-2.5 text-sm leading-tight dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField 
          control={form.control}
          name={`kpis.${index}.method`}
          render={({ field }) => (
            <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
              <FormLabel className="whitespace-nowrap text-sm text-marine">Method</FormLabel>
              <FormControl>
                <textarea 
                  {...field}
                  value={field.value ?? ""}
                  rows={1}
                  ref={(el) => {
                    methodRef.current = el;
                    field.ref(el);
                    syncTextareaHeights();
                  }}
                  onInput={() => syncTextareaHeights()}
                  className="w-full rounded-sm p-2.5 text-sm leading-tight dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="py-0.5 text-sm leading-4.5 text-secondary flex flex-row items-center font-medium gap-1 ms-1.5">
          <TargetIcon className="size-4 shrink-0 block text-secondary" />
          Target
        </div>
        <div className="grid md:grid-cols-5 grid-cols-1 gap-2 overflow-hidden">
          <FormField 
            control={form.control}
            name={`kpis.${index}.target70`}
            render={({ field }) => (
              <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
                  <FormLabel className="whitespace-nowrap text-sm text-marine">Need Improve ({"<"}80%)</FormLabel>
                <FormControl>
                  <textarea 
                    {...field}
                    value={field.value ?? ""}
                    rows={1}
                    ref={(el) => {
                      target70Ref.current = el;
                      field.ref(el);
                      syncTargetTextareaHeights();
                    }}
                    onInput={() => syncTargetTextareaHeights()}
                    className="w-full rounded-sm p-2.5 text-sm leading-tight dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField 
            control={form.control}
            name={`kpis.${index}.target80`}
            render={({ field }) => (
              <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
                <FormLabel className="whitespace-nowrap text-sm text-marine">Level 2 (90%)</FormLabel>
                <FormControl>
                  <textarea 
                    {...field}
                    value={field.value ?? ""}
                    rows={1}
                    ref={(el) => {
                      target80Ref.current = el;
                      field.ref(el);
                      syncTargetTextareaHeights();
                    }}
                    onInput={() => syncTargetTextareaHeights()}
                    className="w-full rounded-sm p-2.5 text-sm leading-tight dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField 
            control={form.control}
            name={`kpis.${index}.target90`}
            render={({ field }) => (
              <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
                <FormLabel className="whitespace-nowrap text-sm text-marine">Meet expert (100%)</FormLabel>
                <FormControl>
                  <textarea 
                    {...field}
                    value={field.value ?? ""}
                    rows={1}
                    ref={(el) => {
                      target90Ref.current = el;
                      field.ref(el);
                      syncTargetTextareaHeights();
                    }}
                    onInput={() => syncTargetTextareaHeights()}
                    className="w-full rounded-sm p-2.5 text-sm leading-tight dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField 
            control={form.control}
            name={`kpis.${index}.target100`}
            render={({ field }) => (
              <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
                <FormLabel className="whitespace-nowrap text-sm text-marine">Level 4 (110%)</FormLabel>
                <FormControl>
                  <textarea 
                    {...field}
                    value={field.value ?? ""}
                    rows={1}
                    ref={(el) => {
                      target100Ref.current = el;
                      field.ref(el);
                      syncTargetTextareaHeights();
                    }}
                    onInput={() => syncTargetTextareaHeights()}
                    className="w-full rounded-sm p-2.5 text-sm leading-tight dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField 
            control={form.control}
            name={`kpis.${index}.target120`}
            render={({ field }) => (
              <FormItem className="grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2">
                <FormLabel className="whitespace-nowrap text-sm text-marine">Outstand (120%)</FormLabel>
                <FormControl>
                  <textarea 
                    {...field}
                    value={field.value ?? ""}
                    rows={1}
                    ref={(el) => {
                      target120Ref.current = el;
                      field.ref(el);
                      syncTargetTextareaHeights();
                    }}
                    onInput={() => syncTargetTextareaHeights()}
                    className="w-full rounded-sm p-2.5 text-sm leading-tight dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 resize-none overflow-hidden whitespace-pre-wrap wrap-break-word"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />
      <CommentSection />
    </div>
  );
};
