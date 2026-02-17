import { useEffect, useMemo, useRef } from "react";
import { BsFileEarmarkText, BsPlusLg } from "react-icons/bs";
import { Resolver, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Toolbar } from "@/components/toolbar";
import { inferProcedureOutput } from "@trpc/server";
import { appRouter } from "@/trpc/routers/_app";
import { useCreateKpi } from "../../api/use-create-kpi";
import { Period } from "@/generated/prisma/enums";
import { Card } from "@/components/card";
import { KpiDefinitionContent } from "../components/kpi-definition-content";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Form } from "@/components/ui/form";
import { KpiDefinitions, kpiDefinitionsSchema } from "../../schema/definition";
import { zodResolver } from "@hookform/resolvers/zod";
import { exportDefinitionKpi, kpiDefinitionMap, validateWeight } from "../../utils";
import { useUpdateBulkKpis } from "../../api/use-update-bulk-kpis";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { useWeight } from "@/modules/kpi/stores/use-weight";
import { Action } from "@/modules/tasks/permissions";
import { Confirmation } from "@/modules/tasks/ui/components/confirmation";
import { createPortal } from "react-dom";
import { useSearchParams } from "@/hooks/use-search-params";
import { Rank } from "@/types/employees";
import { useSaveForm } from "@/modules/tasks/stores/use-save-form";
import { KpiUpload } from "../components/kpi-upload";
import { EmployeeInfo } from "@/components/employee-info";
import { Progress } from "@/components/ui/progress";
import { NumberTicker } from "@/components/number-ticker";
import { Employee, Task } from "@/generated/prisma/client";

interface Props {
  id: string;
  period: Period;
  year: number;
  form: inferProcedureOutput<(typeof appRouter)["kpi"]["getOne"]>["form"];
  permissions: Record<Action, boolean>;
}

export const KpiDefinitionScreen = ({ form, period, id, year, permissions }: Props) => {
  const createKpi = useCreateKpi();
  const { mutate: updateBulkKpis, mutateAsync: updateBulkKpisAsync } = useUpdateBulkKpis(id, period);
  const startWorkflow = useStartWorkflow(form.id, period);
  const { setWeight } = useWeight();
  const { save } = useSaveForm();

  const fileRef = useRef<HTMLInputElement>(null);

  const kpisPopulated =
    form?.kpis?.map((kpi) => ({
      ...kpi,
      year,
    })) ?? [];

  const kpisMapped = kpisPopulated.map((kpi) => kpiDefinitionMap(kpi));

  const f = useForm<KpiDefinitions>({
    resolver: zodResolver(kpiDefinitionsSchema) as Resolver<KpiDefinitions>,
    defaultValues: {
      kpis: kpisMapped || [],
      saved: false,
    },
  });

  const { fields, replace, append, remove } = useFieldArray({
    control: f.control,
    name: "kpis",
    keyName: "fieldId",
  });

  const watchedKpis = useWatch({
    control: f.control,
    name: "kpis",
  });

  const totalWeight = useMemo(() => {
    return watchedKpis?.reduce((sum, kpi) => sum + (Number(kpi?.weight) || 0), 0) ?? 0;
  }, [watchedKpis]);

  useEffect(() => {
    const incoming = kpisMapped;
    const current = f.getValues("kpis") ?? [];

    if (!f.formState.isDirty) {
      f.reset({ kpis: incoming });
      replace(incoming);
      return;
    }

    const currentIds = new Set(current.map((k) => k.id));
    const newOnes = incoming.filter((k) => !currentIds.has(k.id));

    if (newOnes.length) {
      append(newOnes);
    }
  }, [form?.kpis, year, kpisMapped, f, replace, append]); 

  useEffect(() => {
    setWeight(totalWeight);
  }, [totalWeight, setWeight]);

  const onSubmit = (data: KpiDefinitions) => {
    updateBulkKpis({ ...data, saved: true });
  }

  return (
    <Form {...f}>
      <form onSubmit={f.handleSubmit(onSubmit)}>
        <EmployeeInfo 
          owner={form.tasks?.owner} 
          checker={form.tasks?.checker} 
          approver={form.tasks?.approver} 
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-medium text-secondary uppercase tracking-wider">Actual</p>
              <span className="text-base font-bold tabular-nums">
                {/* Change to total weight from useForm */}
                <NumberTicker value={totalWeight} decimalPlaces={1} delay={0.2} />
              </span>
            </div>
          <div>
            <p className="text-[10px] font-medium text-secondary uppercase tracking-wider">Full</p>
            <span className="text-base font-bold tabular-nums from-foreground to-foreground/70 font-mono">
              {validateWeight(form.tasks?.owner.rank as Rank)}
            </span>
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-muted-foreground text-xs">Progress</span>
          <Progress
            className="h-1 w-full"
            value={Math.min((totalWeight / validateWeight(form.tasks?.owner.rank as Rank)) * 100, 100)}
          />
        </div>
        </EmployeeInfo>

        <KpiUpload 
          id={id} 
          period={period} 
          fileRef={fileRef as React.RefObject<HTMLInputElement>} 
        />
        <Toolbar 
          onUpload={() => fileRef.current?.click()}
          permissions={permissions}
          status={STATUS_VARIANTS[form.tasks?.status!]}
          onBeforeFinalSubmit={() => f.setValue("saved", true)}
          onCreate={() => createKpi({ formId: id, period })} 
          onExport={async () => {
            await exportDefinitionKpi({
              ...form,
              kpis: form.kpis,
              employee: form.tasks?.owner,
              task: form.tasks as Task & { checker?: Employee; approver: Employee },
            });
          }}
          onWorkflow={() => {
            if (!save) {
              toast.error("Please confirm the form before starting the workflow");
              return;
            }
            
            if (validateWeight(form.tasks?.owner.rank as Rank) !== totalWeight) {
              toast.error("The total weight of the KPI Bonus is not equal to the owner's rank weight");
              return;
            }

            (async () => {
              // If the form isn't saved yet, validate & save (saved=true) first
              if (!save) {
                f.setValue("saved", true);
                const ok = await f.trigger();
                if (!ok) return;

                const okSave = await updateBulkKpisAsync({ ...f.getValues(), saved: true });
                if (!okSave) return;
              }

              startWorkflow({ id: form.tasks!.id });
            })();
          }}
          onSaveDraft={() => {
            f.setValue("saved", false);
            updateBulkKpis({ ...f.getValues(), saved: false });
          }}
        />
        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45">
          <Empty data-empty={form?.kpis && form?.kpis.length > 0}>
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-16">
                <BsFileEarmarkText className="size-10 text-primary" />
              </EmptyMedia>
              <EmptyTitle>Empty KPI</EmptyTitle>
              <EmptyDescription>create your first KPI</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                size="lg"
                type="button"
                disabled={!permissions.write}
                onClick={() => createKpi({ formId: id, period })}
              >
                <BsPlusLg />
                New KPI
              </Button>
            </EmptyContent>
          </Empty>

          <div
            data-empty={fields.length === 0}
            className="grid grid-cols-1 gap-y-6 data-[empty=true]:hidden"
          >
            {fields.map((field, index) => (
              <KpiDefinitionContent 
                kpi={field} 
                index={index}
                key={field.id} 
                form={f} 
                formId={id} 
                period={period} 
                permissions={permissions}
                onLocalDelete={() => remove(index)}
                comments={form?.kpis.find((kpi) => kpi.id === field.id)?.comments || []}
              />
            ))}
            <Button
              variant="outline"
              size="lg"
              type="button"
              disabled={!permissions.write}
              onClick={() => createKpi({ formId: id, period })}
            >
              <BsPlusLg />
              New KPI
            </Button>
          </div>
        </div>

        {permissions.approve && createPortal(
          <Confirmation 
            id={id} 
            app="KPI Bonus"
            taskId={form.tasks.id} 
            period={period} 
            confirmTitle="Confirm KPI Bonus"
            onSave={async () => {
              f.setValue("saved", true);
              const ok = await f.trigger();
              if (!ok) return false;
              return await updateBulkKpisAsync({ ...f.getValues(), saved: true });
            }}
          />,
          document.body
        )}
      </form>
    </Form>
  );
};