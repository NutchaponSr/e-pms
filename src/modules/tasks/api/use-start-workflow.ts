import { sendStart } from "@/actions/send-start";
import { FormType, Period } from "@/generated/prisma/enums";
import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inferProcedureInput } from "@trpc/server";
import { format } from "date-fns";
import { toast } from "sonner";
import { periodRoutes } from "../constant";

type RequestType = inferProcedureInput<AppRouter["task"]["startWorkflow"]>; 

export const useStartWorkflow = (id: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const startWorkflow = useMutation(trpc.task.startWorkflow.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Starting workflow...", { id: "start-workflow" });

    startWorkflow.mutate(value, {
      onSuccess: async (data) => {
        toast.success("Workflow started!", { id: "start-workflow" });

        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id, period }));
        queryClient.invalidateQueries(trpc.merit.getOne.queryOptions({ id, period }));

        if (data.toEmail && data.fromEmail) {
          await sendStart({
            to: process.env.NODE_ENV === "production" ? data.toEmail : "pondpopza5@gmail.com",
            cc: process.env.NODE_ENV === "production" ? [data.fromEmail] : [],
            subject: `[E-PMS] Action Required: ตรวจสอบและอนุมัติเอกสารจากระบบประเมินการปฏิบัติงาน - ${data.ownerName}`,
            body: `มีเอกสารจากระบบประเมินผลการปฏิบัติงาน เข้ามาในระบบเพื่อรอการตรวจสอบและพิจารณา อนุมัติจากท่าน โดยมีรายละเอียดดังนี้:`,
            checkerName: data.checkerName,
            employeeName: data.ownerName,
            documentType: data.app,
            submitDate: format(new Date(), "yyyy-MM-dd"),
            status: data.status,
            url: data.app === FormType.KPI
              ? `${process.env.NEXT_PUBLIC_APP_URL}/performance/kpi/${id}/${periodRoutes[data.period]}`
              : `${process.env.NEXT_PUBLIC_APP_URL}/performance/merit/${id}/${periodRoutes[data.period]}`,
          });
        }
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "start-workflow" });
      },
    });
  };

  return mutation;
};
