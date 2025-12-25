import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { FormType, Period } from "@/generated/prisma/enums";
import { useSaveForm } from "../stores/use-save-form";
import { sendDone } from "@/actions/send-done";
import { format } from "date-fns";
import { periodRoutes } from "../constant";
import { sendPending } from "@/actions/send-pending";
import { sendReject } from "@/actions/send-reject";

type RequestType = inferProcedureInput<AppRouter["task"]["confirmation"]>;

export const useConfirmation = (id: string, period: Period) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { setSave } = useSaveForm();

  const confirmation = useMutation(trpc.task.confirmation.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Confirming task...", { id: "confirmation" });

    confirmation.mutate(value, {
      onSuccess: async (data) => {
        toast.success("Task confirmed!", { id: "confirmation" });
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id, period }));
        queryClient.invalidateQueries(trpc.merit.getOne.queryOptions({ id, period }));

        setSave(false);

        if (!!data.owner.email && !!data.approver.email) {
          if (data.isApproved) {
            await sendDone({
              to: process.env.NODE_ENV === "production" ? data.owner.email : "pondpopza5@gmail.com",
              cc: process.env.NODE_ENV === "production" ? [data.checker.email || "", data.approver.email] : [],
              subject: `[E-PMS] Completed: แจ้งผลการอนุมัติเอกสาร ${data.app} - ${data.owner.name}`,
              checkerName: data.checker.name,
              employeeName: data.owner.name,
              approverName: data.approver.name, 
              documentType: data.app,
              checkedAt: data.checkedAt ? format(data.checkedAt, "yyyy-MM-dd") : undefined,
              approvedAt: data.approvedAt ? format(data.approvedAt, "yyyy-MM-dd") : undefined,
              url: data.app === FormType.KPI
                ? `${process.env.NEXT_PUBLIC_APP_URL}/performance/kpi/${id}/${periodRoutes[data.period]}`
                : `${process.env.NEXT_PUBLIC_APP_URL}/performance/merit/${id}/${periodRoutes[data.period]}`,
            });
          } else {
            if (value.approved) {
              await sendPending({
                to: process.env.NODE_ENV === "production" ? data.approver.email : "pondpopza5@gmail.com",
                cc: process.env.NODE_ENV === "production" ? [data.checker.email || "", data.owner.email] : [],
                subject: `[E-PMS] Action Required: ตรวจสอบและอนุมัติเอกสารจากระบบประเมินการปฏิบัติงาน (Final Approve) - ${data.owner.name}`,
                checkerName: data.checker.name,
                employeeName: data.owner.name,
                approverName: data.approver.name,
                documentType: data.app,
                checkedAt: data.checkedAt ? format(data.checkedAt, "yyyy-MM-dd") : undefined,
                status: data.status,
                url: data.app === FormType.KPI
                  ? `${process.env.NEXT_PUBLIC_APP_URL}/performance/kpi/${id}/${periodRoutes[data.period]}`
                  : `${process.env.NEXT_PUBLIC_APP_URL}/performance/merit/${id}/${periodRoutes[data.period]}`,
              });
            } else {
              await sendReject({
                to: process.env.NODE_ENV === "production" ? data.owner.email : "pondpopza5@gmail.com",
                cc: process.env.NODE_ENV === "production" ? [data.checker.email || data.approver.email] : [],
                subject: `[E-PMS] Action Required: แจ้งแก้ไขข้อมูล (Declined by Checker) - ${data.app}`,
                checkerName: data.checker.name,
                employeeName: data.owner.name,
                approverName: data.approver.name,
                documentType: data.app,
                checkedAt: data.checkedAt ? format(data.checkedAt, "yyyy-MM-dd") : undefined,
                status: data.status,
                checkedBy: data.checkedBy,
                url: data.app === FormType.KPI
                  ? `${process.env.NEXT_PUBLIC_APP_URL}/performance/kpi/${id}/${periodRoutes[data.period]}`
                  : `${process.env.NEXT_PUBLIC_APP_URL}/performance/merit/${id}/${periodRoutes[data.period]}`,
              });
            }
          }
        }

        router.push("/performance");
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "confirmation" });
      },
    });
  };

  return {
    mutation,
    ctx: confirmation
  };
};