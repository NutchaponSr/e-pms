import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

import { useSaveForm } from "@/modules/tasks/stores/use-save-form";

type RequestType = inferProcedureInput<AppRouter["merit"]["deleteCultureFile"]>;

export const useDeleteCultureFile = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setSave } = useSaveForm();
  const deleteCultureFile = useMutation(trpc.merit.deleteCultureFile.mutationOptions());

  const mutation = (input: RequestType) => {
    deleteCultureFile.mutate(input, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.merit.getOne.queryOptions({ id: formId, period }));
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "delete-culture-file" });
      },
    }); 
  };

  return {
    mutation,
    ctx: deleteCultureFile,
  };
};