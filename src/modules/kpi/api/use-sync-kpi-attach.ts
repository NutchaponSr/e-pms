import { toast } from "sonner";
import { inferProcedureInput } from "@trpc/server";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

type RequestType = inferProcedureInput<AppRouter["kpi"]["syncKpiAttach"]>;

export const useSyncKpiAttach = (_formId: string, _period: Period) => {
  const trpc = useTRPC();
  const syncKpiAttach = useMutation(trpc.kpi.syncKpiAttach.mutationOptions());

  const mutation = (input: RequestType) => {
    // Persist fileUrl immediately; do not invalidate getOne here.
    // Invalidating resets the evaluation form and can wipe unsaved actualOwner text.
    syncKpiAttach.mutate(input, {
      onError: (ctx) => {
        toast.error(ctx.message || "Something went wrong", { id: "sync-kpi-attach" });
      },
    });
  };

  return {
    mutation,
    ctx: syncKpiAttach,
  };
};
