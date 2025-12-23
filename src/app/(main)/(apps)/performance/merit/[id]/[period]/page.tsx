import { Period } from "@/generated/prisma/enums";

import { MeritView } from "@/modules/merit/ui/views/merit-view";

const PERIODS: Record<string, Period> = {
  definition: Period.IN_DRAFT,
  evaluation: Period.EVALUATION,
  evaluation1st: Period.EVALUATION_1ST,
  evaluation2nd: Period.EVALUATION_2ND,
};

const Page = async (props: PageProps<"/performance/merit/[id]/[period]">) => {
  const params = await props.params;

  return <MeritView id={params.id} period={PERIODS[params.period] as Period} />
}

export default Page;