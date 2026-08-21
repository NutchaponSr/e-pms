"use client";

import { toast } from "sonner";
import { createPortal } from "react-dom";
import type { Resolver } from "react-hook-form";
import { BsTriangleFill } from "react-icons/bs";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useSyncExternalStore } from "react";

import type { Rank } from "@/types/employees";
import type { AppRouter } from "@/trpc/routers/_app";
import type { inferProcedureOutput } from "@trpc/server";

import type { Period } from "@/generated/prisma/enums";
import type { Employee, Task } from "@/generated/prisma/client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { Card } from "@/components/card";
import { Toolbar } from "@/components/toolbar";
import { EmployeeInfo } from "@/components/employee-info";
import { NumberTicker } from "@/components/number-ticker";
import { cn } from "@/lib/utils";

import { MeritUpload } from "@/modules/merit/ui/components/merit-upload";
import { Confirmation } from "@/modules/tasks/ui/components/confirmation";
import { CultureDefinitionContent } from "@/modules/merit/ui/components/culture-definition-content";
import { CompetencyDefinitionContent } from "@/modules/merit/ui/components/competency-definition-content";

import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { useDefinitionBulkMerit } from "@/modules/merit/api/use-definition-bulk-merit";

import type { Action } from "@/modules/tasks/permissions";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import type { MeritDefinition } from "@/modules/merit/schemas/definition";
import { meritDefinitionSchema } from "@/modules/merit/schemas/definition";
import { exportMeritDefinition, meritDefinitionMap } from "@/modules/merit/utils";

const CULTURE_TOTAL_WEIGHT = 30;

function subscribeToDocument() {
  return () => {};
}

function getDocumentBody() {
  return document.body;
}

function getServerDocumentBody(): HTMLElement | null {
  return null;
}

interface Props {
  id: string;
  period: Period;
  permissions: Record<Action, boolean>;
  data: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"];
}

export const MeritDefinitionScreen = ({
  data,
  period,
  id,
  permissions,
}: Props) => {
  const mappedData = meritDefinitionMap(data);

  const startWorkflow = useStartWorkflow(id, period);
  const { mutation: definitionBulkMerit, mutateAsync: definitionBulkMeritAsync } =
    useDefinitionBulkMerit(id, period);
  const fileRef = useRef<HTMLInputElement>(null);
  const portalTarget = useSyncExternalStore(
    subscribeToDocument,
    getDocumentBody,
    getServerDocumentBody,
  );

  const form = useForm<MeritDefinition>({
    resolver: zodResolver(meritDefinitionSchema) as Resolver<MeritDefinition>,
    defaultValues: mappedData,
  });

  const competencies = useWatch({ control: form.control, name: "competencies" });

  const totalWeightCompetency =
    competencies?.reduce((sum, kpi) => sum + (Number(kpi?.weight) || 0), 0) ?? 0;

  const competencyRecords = [...data.competencyRecords].sort(
    (a, b) => a.order - b.order,
  );
  const cultureWeight =
    data.cultureRecords.length > 0
      ? CULTURE_TOTAL_WEIGHT / data.cultureRecords.length
      : 0;

  useEffect(() => {
    if (!data) return;

    form.reset(meritDefinitionMap(data), {
      keepDirty: false,
      keepTouched: false,
    });
  }, [data, form]);

  const onSubmit = (values: MeritDefinition) => {
    definitionBulkMerit({ ...values, saved: true });
  };

  const saveDraft = () => {
    form.setValue("saved", false);
    definitionBulkMerit({ ...form.getValues(), saved: false });
  };

  const saveForConfirmation = async () => {
    form.setValue("saved", true);
    const ok = await form.trigger();
    if (!ok) return false;
    return definitionBulkMeritAsync({ ...form.getValues(), saved: true });
  };

  const onWorkflow = async () => {
    form.setValue("saved", true);
    const ok = await form.trigger();
    if (!ok) {
      toast.error("Please fix validation errors before starting the workflow");
      return;
    }

    if (totalWeightCompetency !== CULTURE_TOTAL_WEIGHT) {
      toast.error(
        "The total weight of the KPI Merit is not equal to the owner's rank weight",
      );
      return;
    }

    const okSave = await definitionBulkMeritAsync({
      ...form.getValues(),
      saved: true,
    });
    if (!okSave) return;

    startWorkflow({ id: data.tasks.id });
  };

  const onExport = async () => {
    await exportMeritDefinition({
      ...data,
      competencyRecords: data.competencyRecords,
      cultureRecords: data.cultureRecords,
      employee: data.tasks?.owner,
      task: data.tasks as Task & { checker?: Employee; approver: Employee },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EmployeeInfo
          owner={data.tasks?.owner}
          checker={data.tasks?.checker}
          approver={data.tasks?.approver}
        >
          <WeightSummaryTable
            competency={totalWeightCompetency}
            culture={CULTURE_TOTAL_WEIGHT}
          />
        </EmployeeInfo>
        <MeritUpload
          id={id}
          period={period}
          fileRef={fileRef as React.RefObject<HTMLInputElement>}
          competencyRecords={data.competencyRecords}
          cultureRecords={data.cultureRecords}
        />
        <Toolbar
          onWorkflow={onWorkflow}
          onExport={onExport}
          onSaveDraft={saveDraft}
          onUpload={() => fileRef.current?.click()}
          permissions={permissions}
          status={STATUS_VARIANTS[data.tasks.status]}
        />

        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45">
          <Accordion
            defaultValue={["competency", "culture"]}
            type="multiple"
            className="space-y-4"
          >
            <AccordionItem value="competency">
              <DefinitionAccordionHeader title="สมรรถนะ (Competency)" />
              <AccordionContent>
                <div className="grid grid-cols-1 gap-y-6">
                  {competencyRecords.map((competencyRecord, index) => (
                    <Card key={competencyRecord.id}>
                      <CompetencyDefinitionContent
                        index={index}
                        form={form}
                        competencyRecord={competencyRecord}
                        ownerRank={data.tasks?.owner?.rank as Rank}
                        period={period}
                        formId={id}
                        permissions={permissions}
                      />
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="culture">
              <DefinitionAccordionHeader title="วัฒนธรรม (Culture)" />
              <AccordionContent>
                <div className="grid grid-cols-1 gap-y-6">
                  {data.cultureRecords.map((cultureRecord, index) => (
                    <Card key={cultureRecord.id}>
                      <CultureDefinitionContent
                        index={index}
                        form={form}
                        period={period}
                        formId={id}
                        permissions={permissions}
                        cultureRecord={cultureRecord}
                        weight={cultureWeight}
                        ownerRank={data.tasks?.owner?.rank as Rank}
                      />
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {permissions.approve &&
          portalTarget &&
          createPortal(
            <Confirmation
              id={id}
              app="Merit"
              taskId={data.tasks.id}
              period={period}
              confirmTitle="Confirm Merit Definition"
              onSave={saveForConfirmation}
            />,
            portalTarget,
          )}
      </form>
    </Form>
  );
};

function WeightSummaryTable({
  competency,
  culture,
}: {
  competency: number;
  culture: number;
}) {
  const rows = [
    { label: "Competency", value: competency, isComplete: competency === culture },
    { label: "Culture", value: culture, isComplete: true },
  ] as const;

  return (
    <div className="w-full min-w-[min(100%,12rem)]">
      <div className="overflow-hidden rounded border border-border/80 bg-background text-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-[#2383e218] dark:bg-[#298bfd14]">
              <th className="border-r border-border/70 px-2 py-1 text-left font-medium text-secondary">
                Category
              </th>
              <th className="px-2 py-1 text-center font-medium text-secondary">
                Weight
              </th>
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
                <td className="px-2 py-1 text-center">
                  <NumberTicker
                    value={row.value}
                    decimalPlaces={2}
                    className={cn(
                      "tabular-nums text-xs font-semibold",
                      row.isComplete ? "text-primary" : "text-destructive",
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DefinitionAccordionHeader({ title }: { title: string }) {
  return (
    <div className="h-10.5 z-87 relative text-sm">
      <div className="flex items-center h-full pt-0 mb-2">
        <div className="flex items-center h-full overflow-hidden gap-1">
          <AccordionTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="xsIcon"
              className="group rounded"
            >
              <BsTriangleFill className="text-primary rotate-90 size-3 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </AccordionTrigger>

          <h2 className="text-primary text-lg font-semibold">{title}</h2>
        </div>
      </div>
    </div>
  );
}
