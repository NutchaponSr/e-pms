import type { inferProcedureOutput } from "@trpc/server";
import type { Status } from "@/generated/prisma/enums";
import type { AppRouter } from "@/trpc/routers/_app";

export type OverviewData = inferProcedureOutput<
  AppRouter["admin"]["getOverview"]
>;

export type Drill = { key: string; status: Status } | null;
