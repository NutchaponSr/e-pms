import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

import { useSaveForm } from "@/modules/tasks/stores/use-save-form";

type RequestType = inferProcedureInput<AppRouter["merit"]["definitionBulk"]> & {
  saved: boolean;
};

export const useDefinitionBulkMerit = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setSave } = useSaveForm();
  const definitionBulkMerit = useMutation(trpc.merit.definitionBulk.mutationOptions());

  const mutation = (input: RequestType) => {
    toast.loading("Updating Merit...", { id: "update-bulk-merit" });

    definitionBulkMerit.mutate(input, {
      onSuccess: () => {
        toast.success("Merit Updated!", { id: "update-bulk-merit" });

        queryClient.invalidateQueries(trpc.merit.getOne.queryOptions({ id: formId, period }));

        if (input.saved) {
          setSave(true);
        }
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "update-bulk-merit" });
      },
    }); 
  };

  return {
    mutation,
    ctx: definitionBulkMerit,
  };
};