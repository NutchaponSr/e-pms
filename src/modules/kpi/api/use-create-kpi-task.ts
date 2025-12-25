import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { periodRoutes } from "@/modules/tasks/constant";

type RequestType = inferProcedureInput<AppRouter["kpi"]["createTask"]>;

export const useCreateKpiTask = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createKpiTask = useMutation(trpc.kpi.createTask.mutationOptions());

  const mutation = (input: RequestType) => {
    toast.loading("Creating KPI Task...", { id: "create-kpi-task" });

    createKpiTask.mutate(input, {
      onSuccess: ({ id }) => {
        
        toast.success("KPI Task Created!", { id: "create-kpi-task" });

        queryClient.invalidateQueries(trpc.kpi.getInfo.queryOptions({ year: input.year }));

        router.push(`/performance/kpi/${id}/${periodRoutes[input.period]}`);
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "create-kpi-task" });
      },
    }); 
  };

  return {
    mutation,
    ctx: createKpiTask,
  };
};