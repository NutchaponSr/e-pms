import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { appRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<typeof appRouter["kpi"]["deleteKpiFile"]>;

export const useDeleteKpiFile = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteKpiFile = useMutation(trpc.kpi.deleteKpiFile.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Deleting KPI File...", { id: "delete-kpi-file" });

    deleteKpiFile.mutate(value, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id: formId, period }));

        toast.success("KPI File Deleted!", { id: "delete-kpi-file" });
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "delete-kpi-file" });
      },
    });
  };

  return mutation;
};