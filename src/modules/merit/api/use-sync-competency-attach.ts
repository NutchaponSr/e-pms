import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<AppRouter["merit"]["syncCompetencyAttach"]>;

export const useSyncCompetencyAttach = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const syncCompetencyAttach = useMutation(trpc.merit.syncCompetencyAttach.mutationOptions());

  const mutation = (input: RequestType) => {
    syncCompetencyAttach.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.merit.getOne.queryOptions({ id: formId, period }));
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "sync-competency-attach" });
      },
    });
  };

  return {
    mutation,
    ctx: syncCompetencyAttach,
  };
};
