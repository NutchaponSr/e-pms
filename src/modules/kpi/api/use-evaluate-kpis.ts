import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { appRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

import { useSaveForm } from "@/modules/tasks/stores/use-save-form";

type RequestType = inferProcedureInput<typeof appRouter["kpi"]["evaluate"]> & { saved: boolean };

export const useEvaluateKpis = (id: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { setSave } = useSaveForm();

  const evaluateKpis = useMutation(trpc.kpi.evaluate.mutationOptions());

  const mutation = (input: RequestType) => {
    toast.loading("Updating KPIs...", { id: "update-bulk-kpis" });

    evaluateKpis.mutate(input, {
      onSuccess: () => {
        toast.success("KPIs Updated!", { id: "update-bulk-kpis" });

        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id, period }));

        if (input.saved) {
          setSave(true);
        }
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "update-bulk-kpis" });
      },
    });
  };

  return mutation;
};