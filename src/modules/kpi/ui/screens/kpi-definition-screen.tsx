import { useEffect, useMemo, useRef } from "react";
import { BsFileEarmarkText, BsPlusLg } from "react-icons/bs";
import { Resolver, useFieldArray, useForm } from "react-hook-form";
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
import { kpiDefinitionMap, validateWeight } from "../../utils";
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

interface Props {
  id: string;
  period: Period;
  year: number;
  form: inferProcedureOutput<(typeof appRouter)["kpi"]["getOne"]>["form"];
  permissions: Record<Action, boolean>;
}

export const KpiDefinitionScreen = ({ form, period, id, year, permissions }: Props) => {
  const createKpi = useCreateKpi();
  const updateBulkKpis = useUpdateBulkKpis(id, period);
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
    },
  });

  const { fields, replace } = useFieldArray({
    control: f.control,
    name: "kpis",
    keyName: "fieldId",
  });

  const totalWeight = useMemo(() => {
    return form.kpis?.reduce((sum, kpi) => sum + (Number(kpi?.weight) || 0), 0) ?? 0;
  }, [form.kpis]);

  useEffect(() => {
    f.reset({ kpis: kpisMapped });
    replace(kpisMapped);
  }, [form?.kpis, year]); 

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
          onCreate={() => createKpi({ formId: id, period })} 
          onWorkflow={() => {
            if (!save) {
              toast.error("Please confirm the form before starting the workflow");
              return;
            }
            
            if (validateWeight(form.tasks?.owner.rank as Rank) !== totalWeight) {
              toast.error("The total weight of the KPI Bonus is not equal to the owner's rank weight");
              return;
            }

            startWorkflow({ id: form.tasks!.id })
          }}
          onSaveDraft={() => updateBulkKpis({ ...f.getValues(), saved: false })}
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
                disabled={!permissions.write}
                onClick={() => createKpi({ formId: id, period })}
              >
                <BsPlusLg />
                New KPI
              </Button>
            </EmptyContent>
          </Empty>

          <div
            data-empty={form?.kpis.length === 0}
            className="grid grid-cols-1 gap-y-6 data-[empty=true]:hidden"
          >
            {fields.map((field, index) => (
              <Card key={field.fieldId} className="group/card">
                <KpiDefinitionContent 
                  kpi={field} 
                  index={index} 
                  form={f} 
                  formId={id} 
                  period={period} 
                  permissions={permissions}
                  comments={form?.kpis.find((kpi) => kpi.id === field.id)?.comments || []}
                />
              </Card>
            ))}
          </div>
        </div>

        {permissions.approve && createPortal(
          <Confirmation 
            id={id} 
            app="KPI Bonus"
            taskId={form.tasks.id} 
            period={period} 
            confirmTitle="Confirm KPI Bonus"
            onSave={() => updateBulkKpis({ ...f.getValues(), saved: false })}
          />,
          document.body
        )}
      </form>
    </Form>
  );
};