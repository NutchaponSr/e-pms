import "dotenv/config";

import { FormType, Period, Status } from "@/generated/prisma/client";
import db from "@/lib/db";

export const resetMeritEvaluation1stTasks = async () => {
  console.log("Resetting MERIT EVALUATION_1ST tasks to IN_DRAFT...");

  const result = await db.task.updateMany({
    where: {
      form: {
        type: FormType.MERIT,
      },
      context: {
        path: ["period"],
        equals: Period.EVALUATION_1ST,
      },
    },
    data: {
      status: Status.IN_DRAFT,
      checkedAt: null,
      approvedAt: null,
    },
  });

  console.log(`✅ Reset ${result.count} task(s)`);

  return result.count;
};

(async () => {
  try {
    await resetMeritEvaluation1stTasks();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
