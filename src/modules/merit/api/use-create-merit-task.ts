import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { periodRoutes } from "@/modules/tasks/constant";

type RequestType = inferProcedureInput<AppRouter["merit"]["createTask"]>;

export const useCreateMeritTask = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMeritTask = useMutation(trpc.merit.createTask.mutationOptions());

  const mutation = (input: RequestType) => {
    toast.loading("Creating Merit Task...", { id: "create-merit-task" });

    createMeritTask.mutate(input, {
      onSuccess: ({ id }) => {
        console.log("Merit task created successfully", { 
          year: input.year,
          period: input.period,
        });
        
        toast.success("Merit Task Created!", { id: "create-merit-task" });

        queryClient.invalidateQueries(trpc.merit.getInfo.queryOptions({ year: input.year }));

        router.push(`/performance/merit/${id}/${periodRoutes[input.period]}`);
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "create-merit-task" });
      },
    }); 
  };

  return {
    mutation,
    ctx: createMeritTask,
  };
};