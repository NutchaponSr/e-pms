import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";

import { periodRoutes, routes } from "@/modules/tasks/constant";

type RequestType = inferProcedureInput<AppRouter["task"]["create"]>;

export const useCreateTask = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const createTask = useMutation(trpc.task.create.mutationOptions());

  const mutation = (value: RequestType) => {
    toast.loading("Creating task...", { id: "create-task" });

    createTask.mutate(
      { ...value },
      {
        onSuccess: ({ id }) => {
          queryClient.invalidateQueries(
            trpc.task.getOne.queryOptions({
              year: value.year,
              type: value.type,
            }),
          );

          toast.success("Task Created!", { id: "create-task" });

          router.push(`/performance/${routes[value.type]}/${id}/${periodRoutes[value.period!]}`);
        },
        onError: (ctx) => {
          toast.error(ctx.message || "Something went wrong", {
            id: "create-task",
          });
        },
      },
    );
  };

  return mutation;
};
