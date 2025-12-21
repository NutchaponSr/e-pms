import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/client";

type RequestType = inferProcedureInput<AppRouter["task"]["confirmation"]>;

export const useConfirmation = (id: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const confirmation = useMutation(trpc.task.confirmation.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Confirming task...", { id: "confirmation" });

    confirmation.mutate(value, {
      onSuccess: () => {
        toast.success("Task confirmed!", { id: "confirmation" });
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id, period }));
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