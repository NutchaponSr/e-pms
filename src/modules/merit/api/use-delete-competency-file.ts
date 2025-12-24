import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

import { useSaveForm } from "@/modules/tasks/stores/use-save-form";

type RequestType = inferProcedureInput<AppRouter["merit"]["deleteCompetencyFile"]>;

export const useDeleteCompetencyFile = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setSave } = useSaveForm();
  const deleteCompetencyFile = useMutation(trpc.merit.deleteCompetencyFile.mutationOptions());

  const mutation = (input: RequestType) => {
    deleteCompetencyFile.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.merit.getOne.queryOptions({ id: formId, period }));
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "delete-competency-file" });
      },
    }); 
  };

  return {
    mutation,
    ctx: deleteCompetencyFile,
  };
};