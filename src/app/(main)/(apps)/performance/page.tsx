import { loadSearchParams } from "@/stores/search-params";

import { PerformanceView } from "@/modules/performance/ui/views/performance-view";

const Page = async (props: PageProps<"/performance">) => {
  const { year } = await loadSearchParams(props.searchParams);

  return <PerformanceView year={year} />
}

export default Page;