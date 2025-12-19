import { Period } from "@/generated/prisma/enums";
import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inferProcedureInput } from "@trpc/server";
import { toast } from "sonner";

type RequestType = inferProcedureInput<AppRouter["task"]["startWorkflow"]>; 

export const useStartWorkflow = (id: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const startWorkflow = useMutation(trpc.task.startWorkflow.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Starting workflow...", { id: "start-workflow" });

    startWorkflow.mutate(value, {
      onSuccess: () => {
        toast.success("Workflow started!", { id: "start-workflow" });

        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id, period }));
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "start-workflow" });
      },
    });
  };

  return mutation;
};
