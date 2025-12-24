import { BsTriangleFill } from "react-icons/bs";
import { Resolver, useForm } from "react-hook-form";
import { inferProcedureOutput } from "@trpc/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";

import { AppRouter } from "@/trpc/routers/_app";

import { 
Accordion, 
AccordionContent, 
AccordionItem, 
AccordionTrigger 
} from "@/components/ui/accordion";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { Card } from "@/components/card";
import { Toolbar } from "@/components/toolbar";

import { CompetencyDefinitionContent } from "@/modules/merit/ui/components/competency-definition-content";

import { Action } from "@/modules/tasks/permissions";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { meritDefinitionMap } from "@/modules/merit/utils";
import { MeritDefinition, meritDefinitionSchema } from "@/modules/merit/schemas/definition";
import { Rank } from "@/types/employees";
import { CultureDefinitionContent } from "../components/culture-definition-content";
import { Period } from "@/generated/prisma/enums";
import { useDefinitionBulkMerit } from "../../api/use-definition-bulk-merit";
import { useSaveForm } from "@/modules/tasks/stores/use-save-form";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { toast } from "sonner";
import { EmployeeInfo } from "@/components/employee-info";
import { NumberTicker } from "@/components/number-ticker";
import { useEffect, useMemo } from "react";
import { MeritUpload } from "../components/merit-upload";

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
  permissions 
}: Props) => {
  const mappedData = meritDefinitionMap(data);

  const { save } = useSaveForm(); 

  const startWorkflow = useStartWorkflow(id, period);
  const { mutation: definitionBulkMerit } = useDefinitionBulkMerit(id, period);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<MeritDefinition>({
    resolver: zodResolver(meritDefinitionSchema) as Resolver<MeritDefinition>,
    defaultValues: mappedData,
  });

  const onSubmit = (data: MeritDefinition) => {
    definitionBulkMerit({ ...data, saved: true });
  };

  const totalWeightCompetency = data.competencyRecords.reduce((sum, competency) => sum + (Number(competency.weight) || 0), 0);

  useEffect(() => {
    if (!data) return;

    form.reset(meritDefinitionMap(data), {
      keepDirty: false,
      keepTouched: false,
    });
  }, [data, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EmployeeInfo 
          owner={data.tasks?.owner}
          checker={data.tasks?.checker}
          approver={data.tasks?.approver}
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-col text-secondary">
                <span className="text-xs font-medium uppercase tracking-wide">
                  Competency
                </span>
              </div>
              <div className="flex flex-col items-start p-1">
                <NumberTicker
                  value={totalWeightCompetency}
                  decimalPlaces={2}
                  className="text-lg font-semibold tracking-tighter whitespace-pre-wrap text-primary"
                />
              </div>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-col text-secondary">
                <span className="text-xs font-medium uppercase tracking-wide">
                  Culture
                </span>
              </div>
              <div className="flex flex-col items-start p-1">
                <NumberTicker
                  value={30}
                  decimalPlaces={2}
                  className="text-lg font-semibold tracking-tighter whitespace-pre-wrap text-primary"
                />
              </div>
            </div>
          </div>
        </EmployeeInfo>
        <MeritUpload 
          id={id}
          period={period}
          fileRef={fileRef as React.RefObject<HTMLInputElement>} 
          competencyRecords={data.competencyRecords}
          cultureRecords={data.cultureRecords}
        />
        <Toolbar 
          onWorkflow={() => {
            if (!save) {
              toast.error("Please confirm the form before starting the workflow");
              return;
            }

            if (totalWeightCompetency !== 30) {
              toast.error("The total weight of the KPI Bonus is not equal to the owner's rank weight");
              return;
            }

            startWorkflow({ id: data.tasks.id });
          }}
          onSaveDraft={() => definitionBulkMerit({ ...form.getValues(), saved: false })}
          onUpload={() => fileRef.current?.click()}
          permissions={permissions}
          status={STATUS_VARIANTS[data.tasks?.status!]}
        />

        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45">
          <Accordion
            defaultValue={["competency", "culture"]}
            type="multiple"
            className="space-y-4"
          >
            <AccordionItem value="competency">
              <div className="h-[42px] z-87 relative text-sm">
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

                    <h2 className="text-primary text-lg font-semibold">
                      Competency
                    </h2>
                  </div>
                </div>
              </div>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-y-6">
                  {data.competencyRecords
                    .sort((a, b) => a.order - b.order)
                    .map((competencyRecord, index) => (
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
              <div className="h-[42px] z-87 relative text-sm">
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

                    <h2 className="text-primary text-lg font-semibold">
                      Culture
                    </h2>
                  </div>
                </div>
              </div>
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
                        weight={30 / data.cultureRecords.length}
                        ownerRank={data.tasks?.owner?.rank as Rank}
                      />
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </form>
    </Form>
  );
};