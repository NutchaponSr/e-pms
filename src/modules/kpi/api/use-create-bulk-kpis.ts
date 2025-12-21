import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { appRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<typeof appRouter["kpi"]["createBulk"]>;

export const useCreateBulkKpis = (period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createKpi = useMutation(trpc.kpi.createBulk.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Creating KPIs...", { id: "create-bulk-kpis" });

    createKpi.mutate(value, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id: value.formId, period }));

        toast.success("KPIs Created!", { id: "create-bulk-kpis" });
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "create-bulk-kpis" });
      },
    });
  };

  return mutation;
};