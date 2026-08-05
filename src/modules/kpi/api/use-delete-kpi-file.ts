import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<AppRouter["kpi"]["deleteKpiFile"]>;

export const useDeleteKpiFile = (_formId: string, _period: Period) => {
  const trpc = useTRPC();
  const deleteKpiFile = useMutation(trpc.kpi.deleteKpiFile.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Deleting KPI File...", { id: "delete-kpi-file" });

    // Do not invalidate getOne — form already clears fileUrl via AttachButton onChange.
    deleteKpiFile.mutate(value, {
      onSuccess: () => {
        toast.success("KPI File Deleted!", { id: "delete-kpi-file" });
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "delete-kpi-file" });
      },
    });
  };

  return {
    mutation,
    ctx: deleteKpiFile,
  };
};
