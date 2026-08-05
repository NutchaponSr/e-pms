import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

import { useSaveForm } from "@/modules/tasks/stores/use-save-form";

type EvaluateInput = inferProcedureInput<AppRouter["kpi"]["evaluate"]>;
type RequestType = Omit<EvaluateInput, "formId" | "period"> & { saved: boolean };

export const useEvaluateKpis = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setSave } = useSaveForm();
  const evaluateKpis = useMutation(trpc.kpi.evaluate.mutationOptions());

  const mutation = (input: RequestType) => {
    toast.loading("Updating KPIs...", { id: "update-bulk-kpis" });

    evaluateKpis.mutate(
      { ...input, formId, period },
      {
        onSuccess: () => {
          toast.success("KPIs Updated!", { id: "update-bulk-kpis" });
          queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id: formId, period }));

          if (input.saved) {
            setSave(true);
          }
        },
        onError: (ctx) => {
          toast.error(ctx.message || "Something went wrong", { id: "update-bulk-kpis" });
        },
      },
    );
  };

  const mutationAsync = async (input: RequestType) => {
    toast.loading("Updating KPIs...", { id: "update-bulk-kpis" });

    try {
      const result = await evaluateKpis.mutateAsync({ ...input, formId, period });
      toast.success("KPIs Updated!", { id: "update-bulk-kpis" });
      queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id: formId, period }));

      if (input.saved) {
        setSave(true);
      }

      return result;
    } catch (ctx) {
      toast.error((ctx as Error).message || "Something went wrong", { id: "update-bulk-kpis" });
      throw ctx;
    }
  };

  return {
    mutation,
    mutationAsync,
    ctx: evaluateKpis,
  };
};
