import { Suspense } from "react";

import { Loader } from "@/components/loader";

import { AdminView } from "@/modules/admin/ui/views/admin-view";

export const dynamic = "force-dynamic";

const Page = () => {
  return (
    <Suspense fallback={<Loader />}>
      <AdminView />
    </Suspense>
  );
};

export default Page;
