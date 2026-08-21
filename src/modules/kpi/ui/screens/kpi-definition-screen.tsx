import { zodResolver } from "@hookform/resolvers/zod";
import type { inferProcedureOutput } from "@trpc/server";
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  type FieldPath,
  type Resolver,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { BsFileEarmarkText, BsPlusLg } from "react-icons/bs";
import { toast } from "sonner";
import { EmployeeInfo } from "@/components/employee-info";
import { Toolbar } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Form } from "@/components/ui/form";
import type { Employee, Task } from "@/generated/prisma/client";
import type { Period } from "@/generated/prisma/enums";
import { useWeight } from "@/modules/kpi/stores/use-weight";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import type { Action } from "@/modules/tasks/permissions";
import { Confirmation } from "@/modules/tasks/ui/components/confirmation";
import type { AppRouter } from "@/trpc/routers/_app";
import type { Rank } from "@/types/employees";

import { useCreateKpi } from "../../api/use-create-kpi";
import { useUpdateBulkKpis } from "../../api/use-update-bulk-kpis";
import {
  type KpiDefinitions,
  kpiDefinitionsSchema,
} from "../../schema/definition";
import {
  exportDefinitionKpi,
  kpiDefinitionMap,
  validateWeight,
} from "../../utils";
import { KpiDefinitionContent } from "../components/kpi-definition-content";
import { KpiDefinitionWeightSummary } from "../components/kpi-definition-weight-summary";
import { KpiUpload } from "../components/kpi-upload";

interface Props {
  id: string;
  period: Period;
  year: number;
  form: inferProcedureOutput<AppRouter["kpi"]["getOne"]>["form"];
  permissions: Record<Action, boolean>;
}

function applySchemaIssues(
  setError: ReturnType<typeof useForm<KpiDefinitions>>["setError"],
  issues: { path: PropertyKey[]; message: string }[],
) {
  for (const issue of issues) {
    const path = issue.path.join(".") as FieldPath<KpiDefinitions>;
    setError(path, { type: "validation", message: issue.message });
  }
}

export const KpiDefinitionScreen = ({
  form,
  period,
  id,
  year,
  permissions,
}: Props) => {
  const createKpi = useCreateKpi();
  const { mutate: updateBulkKpis, mutateAsync: updateBulkKpisAsync } =
    useUpdateBulkKpis(id, period);
  const startWorkflow = useStartWorkflow(form.id, period);
  const { setWeight } = useWeight();
  const fileRef = useRef<HTMLInputElement>(null);

  const kpisMapped = useMemo(
    () => (form.kpis ?? []).map((kpi) => kpiDefinitionMap({ ...kpi, year })),
    [form.kpis, year],
  );

  const expectedWeight = validateWeight(form.tasks?.owner.rank as Rank);

  const f = useForm<KpiDefinitions>({
    resolver: zodResolver(kpiDefinitionsSchema) as Resolver<KpiDefinitions>,
    defaultValues: {
      kpis: kpisMapped,
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

  const totalWeight = useMemo(
    () =>
      watchedKpis?.reduce((sum, kpi) => sum + (Number(kpi?.weight) || 0), 0) ??
      0,
    [watchedKpis],
  );

  useEffect(() => {
    const current = f.getValues("kpis") ?? [];

    if (!f.formState.isDirty) {
      f.reset({ kpis: kpisMapped });
      replace(kpisMapped);
      return;
    }

    const currentIds = new Set(current.map((kpi) => kpi.id));
    const newOnes = kpisMapped.filter((kpi) => !currentIds.has(kpi.id));

    if (newOnes.length) {
      append(newOnes);
    }
  }, [kpisMapped, f, replace, append]);

  useEffect(() => {
    setWeight(totalWeight);
  }, [totalWeight, setWeight]);

  const addKpi = () => createKpi({ formId: id, period });

  const onSubmit = (data: KpiDefinitions) => {
    updateBulkKpis({ ...data, saved: true });
  };

  const saveDraft = () => {
    f.setValue("saved", false);
    updateBulkKpis({ ...f.getValues(), saved: false });
  };

  const saveForConfirmation = async () => {
    f.setValue("saved", true);
    const ok = await f.trigger();
    if (!ok) return false;
    return updateBulkKpisAsync({ ...f.getValues(), saved: true });
  };

  const onWorkflow = async () => {
    f.setValue("saved", true);

    const isValid = await f.trigger();
    if (!isValid) {
      toast.error("Please fix validation errors before starting the workflow");
      return;
    }

    const formValues = f.getValues();
    const schemaResult = kpiDefinitionsSchema.safeParse(formValues);
    if (!schemaResult.success) {
      toast.error("Please fix validation errors before starting the workflow");
      applySchemaIssues(f.setError, schemaResult.error.issues);
      return;
    }

    if (expectedWeight !== totalWeight) {
      toast.error(
        "The total weight of the KPI Bonus is not equal to the owner's rank weight",
      );
      return;
    }

    const okSave = await updateBulkKpisAsync({ ...formValues, saved: true });
    if (!okSave) return;

    startWorkflow({ id: form.tasks.id });
  };

  return (
    <Form {...f}>
      <form onSubmit={f.handleSubmit(onSubmit)}>
        <EmployeeInfo
          owner={form.tasks?.owner}
          checker={form.tasks?.checker}
          approver={form.tasks?.approver}
        >
          <KpiDefinitionWeightSummary
            actual={totalWeight}
            full={expectedWeight}
          />
        </EmployeeInfo>

        <KpiUpload id={id} period={period} fileRef={fileRef} />
        <Toolbar
          onUpload={() => fileRef.current?.click()}
          permissions={permissions}
          status={STATUS_VARIANTS[form.tasks.status]}
          onCreate={addKpi}
          onExport={async () => {
            await exportDefinitionKpi({
              ...form,
              kpis: form.kpis,
              employee: form.tasks?.owner,
              task: form.tasks as Task & {
                checker?: Employee;
                approver: Employee;
              },
            });
          }}
          onWorkflow={onWorkflow}
          onSaveDraft={saveDraft}
        />
        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45">
          <Empty data-empty={Boolean(form.kpis?.length)}>
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-16">
                <BsFileEarmarkText className="size-10 text-primary" />
              </EmptyMedia>
              <EmptyTitle>Empty KPI</EmptyTitle>
              <EmptyDescription>create your first KPI</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {permissions.write && <NewKpiButton onClick={addKpi} />}
            </EmptyContent>
          </Empty>

          <div
            data-empty={fields.length === 0}
            className="grid grid-cols-1 gap-y-2 data-[empty=true]:hidden"
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
                comments={
                  form.kpis.find((kpi) => kpi.id === field.id)?.comments || []
                }
              />
            ))}
            {permissions.write && <NewKpiButton onClick={addKpi} />}
          </div>
        </div>

        {permissions.approve &&
          createPortal(
            <Confirmation
              id={id}
              app="KPI Bonus"
              taskId={form.tasks.id}
              period={period}
              confirmTitle="Confirm KPI Bonus"
              onSave={saveForConfirmation}
            />,
            document.body,
          )}
      </form>
    </Form>
  );
};

function NewKpiButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="lg"
      type="button"
      onClick={onClick}
    >
      <BsPlusLg />
      New KPI
    </Button>
  );
}
