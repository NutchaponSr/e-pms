import { inferProcedureOutput } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

import { Action, Approval } from "@/modules/tasks/permissions";
import { meritEvaluationsMap } from "../../utils";
import { useEffect, useMemo } from "react";
import { MeritEvaluation, meritEvaluationsSchema } from "../../schemas/evaluation";
import { Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { EmployeeInfo } from "@/components/employee-info";
import { NumberTicker } from "@/components/number-ticker";
import { ScoreBoard } from "../components/score-board";
import { Toolbar } from "@/components/toolbar";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { Button } from "@/components/ui/button";
import { BsTriangleFill } from "react-icons/bs";
import { Accordion, AccordionTrigger, AccordionItem } from "@/components/ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";
import { CompetencyEvaluationContent } from "../components/competency-evaluation-content";
import { Card } from "@/components/card";
import { CultureEvaluationContent } from "../components/culture-evaluation-content";
import { useEvaluateBulkMerit } from "../../api/use-evaluation-bulk-merit";
import { useSaveForm } from "@/modules/tasks/stores/use-save-form";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { toast } from "sonner";

interface Props {
  id: string;
  period: Period;
  role: Approval;
  hasChecker: boolean;
  data: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"];
  permissions: Record<Action, boolean>;
}

export const MeritEvaluationScreen = ({ id, period, data, permissions, role, hasChecker }: Props) => {
  const evaluations = meritEvaluationsMap(data, period, role);
  
  const { save } = useSaveForm();
  const startWorkflow = useStartWorkflow(id, period);
  const { mutation: evaluateBulkMerit } = useEvaluateBulkMerit(id, period);

  const form = useForm<MeritEvaluation>({
    resolver: zodResolver(meritEvaluationsSchema) as Resolver<MeritEvaluation>,
    defaultValues: evaluations,
  });

  useEffect(() => {
    if (!data) return;

    form.reset(meritEvaluationsMap(data, period, role), {
      keepDirty: false,
      keepTouched: false,
    });
  }, [data, form, period, role]);

  const onSubmit = (data: MeritEvaluation) => {
    evaluateBulkMerit({ ...data, saved: true });
  };

  // useWatch find total competency and culture achievement for each role
  const competencies = useWatch({
    control: form.control,
    name: "competencies",
  });

  const cultures = useWatch({
    control: form.control,
    name: "cultures",
  });

  const scores = useMemo(() => {
    // Calculate competency achievement for each role
    const competencyOwner = competencies?.reduce((acc, competency, index) => {
      const achievement = Number(competency?.achievementOwner ?? 0);
      const weight = Number(data.competencyRecords[index]?.weight ?? 0);
      return acc + (achievement / 5) * weight;
    }, 0) ?? 0;

    const competencyChecker = competencies?.reduce((acc, competency, index) => {
      const achievement = Number(competency?.achievementChecker ?? 0);
      const weight = Number(data.competencyRecords[index]?.weight ?? 0);
      return acc + (achievement / 5) * weight;
    }, 0) ?? 0;

    const competencyApprover = competencies?.reduce((acc, competency, index) => {
      const achievement = Number(competency?.achievementApprover ?? 0);
      const weight = Number(data.competencyRecords[index]?.weight ?? 0);
      return acc + (achievement / 5) * weight;
    }, 0) ?? 0;

    // Calculate culture achievement for each role
    const cultureWeight = 30 / data.cultureRecords.length;
    const cultureOwner = cultures?.reduce((acc, culture) => {
      const achievement = Number(culture?.levelBehaviorOwner ?? 0);
      return acc + (achievement / 5) * cultureWeight;
    }, 0) ?? 0;

    const cultureChecker = cultures?.reduce((acc, culture) => {
      const achievement = Number(culture?.levelBehaviorChecker ?? 0);
      return acc + (achievement / 5) * cultureWeight;
    }, 0) ?? 0;

    const cultureApprover = cultures?.reduce((acc, culture) => {
      const achievement = Number(culture?.levelBehaviorApprover ?? 0);
      return acc + (achievement / 5) * cultureWeight;
    }, 0) ?? 0;

    // Calculate total for each role
    const totalOwner = data.kpi + competencyOwner + cultureOwner;
    const totalChecker = data.kpi + competencyChecker + cultureChecker;
    const totalApprover = data.kpi + competencyApprover + cultureApprover;

    return {
      owner: {
        competency: competencyOwner,
        culture: cultureOwner,
        total: totalOwner,
      },
      checker: {
        competency: competencyChecker,
        culture: cultureChecker,
        total: totalChecker,
      },
      approver: {
        competency: competencyApprover,
        culture: cultureApprover,
        total: totalApprover,
      },
    };
  }, [competencies, cultures, data.competencyRecords, data.cultureRecords.length, data.kpi]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EmployeeInfo owner={data.tasks?.owner} checker={data.tasks?.checker} approver={data.tasks?.approver}>
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-col text-secondary">
              <span className="text-xs font-medium uppercase tracking-wide">
                Full
              </span>
            </div>
            <div className="flex flex-col items-start p-3">
              <NumberTicker
                value={100}
                className="text-3xl font-semibold tracking-tighter whitespace-pre-wrap text-primary"
              />
            </div>
          </div>
        </EmployeeInfo>

        <div className="px-3 pt-3 w-full grid grid-cols-3 gap-2">
          <ScoreBoard title="Owner" kpi={data.kpi} competency={scores.owner.competency} culture={scores.owner.culture} total={scores.owner.total} />
          <ScoreBoard title="Checker" kpi={data.kpi} competency={scores.checker.competency} culture={scores.checker.culture} total={scores.checker.total} />
          <ScoreBoard title="Approver" kpi={data.kpi} competency={scores.approver.competency} culture={scores.approver.culture} total={scores.approver.total} />
        </div>

        <Toolbar 
          onWorkflow={() => {
            if (!save) {
              toast.error("Please confirm the form before starting the workflow");
              return;
            }

            startWorkflow({ id: data.tasks.id });
          }}
          onSaveDraft={() => evaluateBulkMerit({ ...form.getValues(), saved: false })}
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
                        <CompetencyEvaluationContent 
                          index={index} 
                          period={period} 
                          competencyRecord={competencyRecord} 
                          form={form} 
                          permissions={{
                            canPerformOwner: permissions.write && role === "owner",
                            canPerformChecker: permissions.write && role === "checker",
                            canPerformApprover: permissions.write && role === "approver",
                          }}
                          hasChecker={hasChecker}
                          formId={id}
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
                    <h2 className="text-primary text-lg font-semibold">Culture</h2>
                  </div>
                </div>
              </div>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-y-6">
                  {data.cultureRecords
                  .sort((a, b) => a.order - b.order)
                  .map((cultureRecord, index) => (
                    <Card key={cultureRecord.id}>
                      <CultureEvaluationContent 
                        index={index}
                        period={period}
                        cultureRecord={cultureRecord}
                        form={form}
                        permissions={{
                          canPerformOwner: permissions.write && role === "owner",
                          canPerformChecker: permissions.write && role === "checker",
                          canPerformApprover: permissions.write && role === "approver",
                        }}
                        weight={30 / data.cultureRecords.length}
                        hasChecker={hasChecker}
                        formId={id}
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
}