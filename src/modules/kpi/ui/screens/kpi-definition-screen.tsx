import { useEffect } from "react";
import { BsFileEarmarkText, BsPlusLg } from "react-icons/bs";
import { Resolver, useFieldArray, useForm } from "react-hook-form";

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
import { bonusEvaluationMapValue } from "../../utils";
import { useUpdateBulkKpis } from "../../api/use-update-bulk-kpis";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { useWeight } from "@/modules/kpi/stores/use-weight";

interface Props {
  id: string;
  period: Period;
  year: number;
  form: inferProcedureOutput<(typeof appRouter)["kpi"]["getOne"]>;
}

export const KpiDefinitionScreen = ({ form, period, id, year }: Props) => {
  const createKpi = useCreateKpi();
  const updateBulkKpis = useUpdateBulkKpis();
  const startWorkflow = useStartWorkflow(form.id, period);
  const { setWeight } = useWeight();

  const kpisPopulated =
    form?.kpis?.map((kpi) => ({
      ...kpi,
      year,
    })) ?? [];

  const kpisMapped = kpisPopulated.map((kpi) => bonusEvaluationMapValue(kpi));

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

  useEffect(() => {
    f.reset({ kpis: kpisMapped });
    replace(kpisMapped);
  }, [form?.kpis, year]); 

  useEffect(() => {
    const subscription = f.watch((value) => {
      const totalWeight =
        value.kpis?.reduce(
          (sum, kpi) => sum + (Number(kpi?.weight) || 0),
          0,
        ) ?? 0;

      setWeight(totalWeight);
    });

    return () => subscription.unsubscribe?.();
  }, [f, setWeight]);

  const onSubmit = (data: KpiDefinitions) => {
    updateBulkKpis(data);
  }

  return (
    <Form {...f}>
      <form onSubmit={f.handleSubmit(onSubmit)}>
        <Toolbar 
          status={STATUS_VARIANTS[form.tasks?.status!]}
          onCreate={() => createKpi({ formId: id, period })} 
          onWorkflow={() => startWorkflow({ id: form.tasks!.id })}
          confirmTitle="Start Workflow"
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
                  comments={form?.kpis.find((kpi) => kpi.id === field.id)?.comments || []}
                />
              </Card>
            ))}
          </div>
        </div>
      </form>
    </Form>
  );
};
