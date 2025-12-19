import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { appRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<typeof appRouter["kpi"]["delete"]>;

export const useDeleteKpi = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createKpi = useMutation(trpc.kpi.delete.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Deleting KPI...", { id: "delete-kpi" });

    createKpi.mutate(value, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id: formId, period }));

        toast.success("KPI Deleted!", { id: "delete-kpi" });
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "delete-kpi" });
      },
    });
  };

  return mutation;
};