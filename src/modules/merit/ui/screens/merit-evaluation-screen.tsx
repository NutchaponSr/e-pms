import { inferProcedureOutput } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

import { Action, Approval } from "@/modules/tasks/permissions";
import { exportMeritDefinition, meritEvaluationsMap } from "../../utils";
import { useEffect, useMemo } from "react";
import { MeritEvaluation, meritEvaluationsSchema } from "../../schemas/evaluation";
import { Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { EmployeeInfo } from "@/components/employee-info";
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
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { toast } from "sonner";
import { competencyLevels, cultureLevels, MERIT_EVALUATION_PERIOD_LABELS } from "../../constant";
import { FormGenerator } from "@/components/form-generator";
import { cn } from "@/lib/utils";
import { formRecord } from "@/types/form";
import { Confirmation } from "@/modules/tasks/ui/components/confirmation";
import { createPortal } from "react-dom";
import { Employee, Task } from "@/generated/prisma/client";
import { MeritEvaluationSummaryTable } from "../components/merit-evaluation-summary-table";

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
  
  const startWorkflow = useStartWorkflow(id, period);
  const { mutation: evaluateBulkMerit } = useEvaluateBulkMerit(id, period);

  const form = useForm<MeritEvaluation>({
    resolver: zodResolver(meritEvaluationsSchema) as Resolver<MeritEvaluation>,
    defaultValues: evaluations,
    reValidateMode: "onChange",
  });

  const revalidateOverallComments = () => {
    void form.trigger([
      "overallComments.commentOwner",
      "overallComments.commentChecker",
      "overallComments.commentApprover",
    ]);
  };

  useEffect(() => {
    if (!data) return;

    form.reset(meritEvaluationsMap(data, period, role), {
      keepDirty: false,
      keepTouched: false,
    });
  }, [data, form, period, role]);

  const submitEvaluation = (values: MeritEvaluation, saved: boolean) => {
    evaluateBulkMerit({
      formId: id,
      period,
      ...values,
      saved,
    });
  };

  const onSubmit = (data: MeritEvaluation) => {
    submitEvaluation(data, true);
  };

  const blueFormClass = {
    input: formRecord.blue.input,
    label: formRecord.blue.label,
    description: "text-xs text-secondary",
    form: "flex flex-col gap-2 flex-1 min-h-0 bg-transparent p-0 h-auto",
  };

  const evaluationColumnClass =
    "flex flex-col gap-2 min-h-0 h-full p-2 bg-[#0080d51c] dark:bg-[#298bfd10] rounded-sm";

  const periodLabel = MERIT_EVALUATION_PERIOD_LABELS[period];

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

    const competencyFull = data.competencyRecords.reduce(
      (acc, record) => acc + Number(record.weight ?? 0),
      0,
    );
    const cultureFull = 30;

    return {
      competencyFull,
      cultureFull,
      owner: {
        competency: competencyOwner,
        culture: cultureOwner,
      },
      checker: {
        competency: competencyChecker,
        culture: cultureChecker,
      },
      approver: {
        competency: competencyApprover,
        culture: cultureApprover,
      },
    };
  }, [competencies, cultures, data.competencyRecords, data.cultureRecords.length]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EmployeeInfo owner={data.tasks?.owner} checker={data.tasks?.checker} approver={data.tasks?.approver}>
          <MeritEvaluationSummaryTable
            hasChecker={hasChecker}
            competencyFull={scores.competencyFull}
            cultureFull={scores.cultureFull}
            scores={{
              owner: scores.owner,
              checker: scores.checker,
              approver: scores.approver,
            }}
          />
        </EmployeeInfo>

        <Toolbar 
          onWorkflow={async () => {
            const ok = await form.trigger();
            
            if (!ok) {
              toast.error("Please fix validation errors before starting the workflow");
              return;
            }

            submitEvaluation(form.getValues(), true);
            startWorkflow({ id: data.tasks.id });
          }}
          onExport={async () => {
            await exportMeritDefinition({
              ...data,
              competencyRecords: data.competencyRecords,
              cultureRecords: data.cultureRecords,
              employee: data.tasks?.owner,
              task: data.tasks as Task & { checker?: Employee; approver: Employee },
            });
          }}
          onSaveDraft={() => submitEvaluation(form.getValues(), false)}
          permissions={permissions}
          status={STATUS_VARIANTS[data.tasks?.status!]}
        />

        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45">
          <Accordion
            defaultValue={["competency", "culture", "overall-comments"]}
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
            <AccordionItem value="overall-comments">
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
                      ข้อคิดเห็น/ข้อเสนอแนะภาพรวม (Overall Comments / Recommendations)
                    </h2>
                  </div>
                </div>
              </div>
              <AccordionContent>
                {periodLabel && (
                  <p className="text-primary text-sm font-medium mb-4">
                    {periodLabel}
                  </p>
                )}
                <div
                  className={cn(
                    "grid gap-4",
                    hasChecker ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2",
                  )}
                >
                  <div className={evaluationColumnClass}>
                    <FormGenerator
                      name="overallComments.commentOwner"
                      form={form}
                      variant="bigText"
                      label="พนักงาน (Employee)"
                      disabled={!(permissions.write && role === "owner")}
                      className={blueFormClass}
                      onInput={revalidateOverallComments}
                    />
                  </div>
                  {hasChecker && (
                    <div className={evaluationColumnClass}>
                      <FormGenerator
                        name="overallComments.commentChecker"
                        form={form}
                        variant="bigText"
                        label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)"
                        disabled={!(permissions.write && role === "checker")}
                        className={blueFormClass}
                        onInput={revalidateOverallComments}
                      />
                    </div>
                  )}
                  <div className={evaluationColumnClass}>
                    <FormGenerator
                      name="overallComments.commentApprover"
                      form={form}
                      variant="bigText"
                      label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)"
                      disabled={!(permissions.write && role === "approver")}
                      className={blueFormClass}
                      onInput={revalidateOverallComments}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {permissions.approve && createPortal(
          <Confirmation 
            id={id} 
            app="Merit"
            taskId={data.tasks.id} 
            period={period} 
            confirmTitle="Confirm Merit Evaluation"
            onSave={async () => {
              const ok = await form.trigger();

              if (!ok) {
                toast.error("Please fix validation errors before confirming");
                return false;
              }

              submitEvaluation(form.getValues(), false);
              return true;
            }}
          />,
          document.body
        )}
      </form>
    </Form>
  );
}