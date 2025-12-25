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
import { competencyLevels, cultureLevels } from "../../constant";

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
                <div className="grid grid-cols-3 gap-4 pb-4">
                  <Card className="p-0">
                    <div className="flex flex-col min-w-0 w-full min-h-8 space-y-1">
                      <h2 className="max-w-full w-full whitespace-break-spaces [word-break:break-word] text-sm font-semibold leading-[1.3] text-primary">
                        หลักเกณฑ์การประเมิน (Evaluation Score System)
                      </h2>
                      <div className="max-w-full w-full whitespace-break-spaces [word-break:break-word] text-primary text-xs leading-4.5">
                        วิเคราะห์ผลการปฏิบัติงาน เปรียบเทียบกับผลงานที่คาดหวัง (Expected Key Result) และการแสดงออกของ Competency
                      </div>
                    </div>
                  </Card>
                  <div className="flex items-center gap-1 col-span-2">
                    <div className="flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.086)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] rounded">
                      <div className="flex items-center gap-2 bg-marine py-1 px-2 rounded-t">
                        <h3 className="text-white text-lg font-semibold">
                          เกณฑ์การประเมิน Competency
                        </h3>
                      </div>
                      <div className="flex items-center p-2">
                        {competencyLevels.map((item, index) => (
                          <div key={index} className="flex flex-col p-1 space-y-2 rounded">
                            <span className="font-medium leading-normal overflow-hidden pe-1.5">
                              <div className="inline-flex items-center shrink min-w-0 max-w-full h-5 m-0 rounded-full px-2 text-xs dark:text-blue-neutral text-blue-muted bg-[#0063ae2c] dark:bg-[#3b98ff62]">
                                <div className="whitespace-nowrap overflow-hidden text-ellipsis inline-flex items-center h-5 leading-5">
                                  <div className="flex items-center">
                                    <div className="me-1 rounded-full size-2 bg-marine inline-flex shrink-0" />
                                  </div>
                                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.label}
                                  </span>
                                </div>
                              </div>
                            </span>

                            <div className="min-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow px-px text-xs text-primary">
                              {item.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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
                <div className="grid grid-cols-3 gap-4 pb-4">
                  <Card className="p-0">
                    <div className="flex flex-col min-w-0 w-full min-h-8 space-y-1">
                      <h2 className="max-w-full w-full whitespace-break-spaces [word-break:break-word] text-sm font-semibold leading-[1.3] text-primary">
                        หลักเกณฑ์การประเมิน (Evaluation Score System)
                      </h2>
                      <div className="max-w-full w-full whitespace-break-spaces [word-break:break-word] text-primary text-xs leading-4.5">
                        วิเคราะห์ผลการปฏิบัติงาน เปรียบเทียบกับผลงานที่คาดหวัง (Expected Key Result) และการแสดงออกของ Competency
                      </div>
                    </div>
                  </Card>
                  <div className="flex items-center gap-1 col-span-2">
                    <div className="flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.086)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] rounded">
                      <div className="flex items-center gap-2 bg-marine py-1 px-2 rounded-t">
                        <h3 className="text-white text-lg font-semibold">
                          เกณฑ์การประเมิน Culture
                        </h3>
                      </div>
                      <div className="flex items-center p-2">
                        {cultureLevels.map((item, index) => (
                          <div key={index} className="flex flex-col p-1 space-y-2 rounded">
                            <span className="font-medium leading-normal overflow-hidden pe-1.5">
                              <div className="inline-flex items-center shrink min-w-0 max-w-full h-5 m-0 rounded-full px-2 text-xs dark:text-blue-neutral text-blue-muted bg-[#0063ae2c] dark:bg-[#3b98ff62]">
                                <div className="whitespace-nowrap overflow-hidden text-ellipsis inline-flex items-center h-5 leading-5">
                                  <div className="flex items-center">
                                    <div className="me-1 rounded-full size-2 bg-blue inline-flex shrink-0" />
                                  </div>
                                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.label}
                                  </span>
                                </div>
                              </div>
                            </span>

                            <div className="min-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow px-px text-xs text-primary">
                              {item.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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