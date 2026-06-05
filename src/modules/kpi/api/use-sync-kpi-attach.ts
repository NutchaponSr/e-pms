import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<AppRouter["kpi"]["syncKpiAttach"]>;

export const useSyncKpiAttach = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const syncKpiAttach = useMutation(trpc.kpi.syncKpiAttach.mutationOptions());

  const mutation = (input: RequestType) => {
    syncKpiAttach.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id: formId, period }));
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "sync-kpi-attach" });
      },
    });
  };

  return {
    mutation,
    ctx: syncKpiAttach,
  };
};
