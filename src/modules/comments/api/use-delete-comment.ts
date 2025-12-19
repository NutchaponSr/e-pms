import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { appRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<typeof appRouter["comment"]["delete"]>;

export const useDeleteComment = (id: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteComment = useMutation(trpc.comment.delete.mutationOptions());

  const mutation = (input: RequestType) => {
    deleteComment.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id, period }));
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong");
      },
    });
  };

  return mutation;
};