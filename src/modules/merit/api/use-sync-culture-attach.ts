import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<AppRouter["merit"]["syncCultureAttach"]>;

export const useSyncCultureAttach = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const syncCultureAttach = useMutation(trpc.merit.syncCultureAttach.mutationOptions());

  const mutation = (input: RequestType) => {
    syncCultureAttach.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.merit.getOne.queryOptions({ id: formId, period }));
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "sync-culture-attach" });
      },
    });
  };

  return {
    mutation,
    ctx: syncCultureAttach,
  };
};
