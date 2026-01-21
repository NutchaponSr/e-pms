import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { appRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<typeof appRouter["kpi"]["delete"]>;

export const useDeleteKpi = (formId: string, period: Period) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteKpi = useMutation(trpc.kpi.delete.mutationOptions());

  const mutation = async (value: RequestType) => {
    const toastId = "delete-kpi";
    toast.loading("Deleting KPI...", { id: toastId });

    try {
      await deleteKpi.mutateAsync(value);

      await queryClient.invalidateQueries(
        trpc.kpi.getOne.queryOptions({ id: formId, period }),
      );

      toast.success("KPI Deleted!", { id: toastId });
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong", { id: toastId });
    }
  };

  return {
    mutation,
    opt: deleteKpi,
  };
};