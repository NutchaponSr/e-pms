import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { appRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<typeof appRouter["comment"]["create"]> & { period: Period, formId: string };

export const useCreateComment = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createComment = useMutation(trpc.comment.create.mutationOptions());

  const mutation = (input: RequestType) => {
    createComment.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id: input.formId, period: input.period }));
        queryClient.invalidateQueries(trpc.merit.getOne.queryOptions({ id: input.formId, period: input.period }));
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong");
      },
    });
  };

  return mutation;
};