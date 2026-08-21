import { notFound } from "next/navigation";

import { parseKpiPeriodParam } from "@/modules/kpi/constants";
import { KpiView } from "@/modules/kpi/ui/views/kpi-view";
import { loadSearchParams } from "@/stores/search-params";

const Page = async (props: PageProps<"/performance/kpi/[id]/[period]">) => {
  const params = await props.params;
  const { year } = await loadSearchParams(props.searchParams);
  const period = parseKpiPeriodParam(params.period);

  if (!period) {
    notFound();
  }

  return <KpiView id={params.id} period={period} year={year} />;
};

export default Page;
