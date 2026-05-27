import { Suspense } from "react";

import { loadSearchParams } from "@/stores/search-params";

import { Loader } from "@/components/loader";

import { PerformanceView } from "@/modules/performance/ui/views/performance-view";

export const dynamic = "force-dynamic";

const Page = async (props: PageProps<"/performance">) => {
  const { year } = await loadSearchParams(props.searchParams);

  return (
    <Suspense fallback={<Loader />}>
      <PerformanceView year={year} />
    </Suspense>
  );
};

export default Page;
