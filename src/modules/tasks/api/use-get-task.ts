import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { FormType } from "@/generated/prisma/client";

export const useGetTask = (year: number, type: FormType) => {
  const trpc = useTRPC();
  
  const query = useSuspenseQuery(trpc.task.getOne.queryOptions({ year, type }));

  return query;
}