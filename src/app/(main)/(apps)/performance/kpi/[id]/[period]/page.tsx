import { Period } from "@/generated/prisma/enums";
import { loadSearchParams } from "@/stores/search-params";

import { KpiView } from "@/modules/kpi/ui/views/kpi-view";

const PERIODS: Record<string, Period> = {
  definition: Period.IN_DRAFT,
  evaluation: Period.EVALUATION,
};

const Page = async (props: PageProps<"/performance/kpi/[id]/[period]">) => {
  const params = await props.params;

  const { year } = await loadSearchParams(props.searchParams);

  const periodValue = PERIODS[params.period] || Period.IN_DRAFT;
  
  return <KpiView id={params.id} period={periodValue} year={year} />
}

export default Page;

