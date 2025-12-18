import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { appRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<typeof appRouter["kpi"]["create"]> & { period: Period };

export const useCreateKpi = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createKpi = useMutation(trpc.kpi.create.mutationOptions());

  const mutation = ({ formId, period }: RequestType) => {
    toast.loading("Creating KPI...", { id: "create-kpi" });

    createKpi.mutate({ formId }, {
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.kpi.getOne.queryOptions({ id: formId, period }));

        toast.success("KPI Created!", { id: "create-kpi" });
      },
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "create-kpi" });
      },
    });
  };

  return mutation;
};