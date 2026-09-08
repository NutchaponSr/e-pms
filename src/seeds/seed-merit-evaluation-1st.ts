import "dotenv/config";

import path from "path";

import { Period, Status } from "@/generated/prisma/enums";
import { readCSVRows } from "@/seeds/lib/utils";
import {
  connectSeedDb,
  disconnectSeedDb,
  findInChunks,
  runInChunks,
  seedDb as db,
} from "@/seeds/lib/db";

const DATA_DIR = path.join(process.cwd(), "src/data");

const emptyToNull = (value: string | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "\\N") return null;
  return trimmed.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
};

const toInt = (value: string | undefined) => {
  const parsed = emptyToNull(value);
  if (parsed == null) return null;
  const number = Number(parsed);
  return Number.isFinite(number) ? number : null;
};

const toDate = (value: string | undefined) => {
  const parsed = emptyToNull(value);
  if (parsed == null) return null;
  const date = new Date(parsed);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toStatus = (value: string | undefined): Status => {
  const parsed = emptyToNull(value);
  if (parsed && Object.values(Status).includes(parsed as Status)) {
    return parsed as Status;
  }
  return Status.IN_DRAFT;
};

const parseTaskContext = (raw: string | undefined) => {
  const value = emptyToNull(raw);
  if (!value) return { period: Period.EVALUATION_1ST };

  const candidates = [
    value,
    value.replace(/'/g, '"'),
    value.replace(/'{/g, "{").replace(/}'/g, "}"),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { period?: string };
      if (parsed.period === Period.EVALUATION_1ST) {
        return { period: Period.EVALUATION_1ST };
      }
    } catch {
      // try next candidate
    }
  }

  if (value.includes(Period.EVALUATION_1ST)) {
    return { period: Period.EVALUATION_1ST };
  }

  return null;
};

const isEvaluation1st = (value: string | undefined) =>
  emptyToNull(value) === Period.EVALUATION_1ST;

export const seedMeritEvaluation1st = async () => {
  console.log("Seeding MERIT EVALUATION_1ST from CSV...");

  const taskRows = readCSVRows(path.join(DATA_DIR, "task.csv"));
  const cultureRows = readCSVRows(path.join(DATA_DIR, "cultureEvaluation.csv"));
  const competencyRows = readCSVRows(
    path.join(DATA_DIR, "competencyEvaluation.csv"),
  );
  const commentRows = readCSVRows(
    path.join(DATA_DIR, "meritOverallComment.csv"),
  );

  const tasks = taskRows.flatMap((row) => {
    const [
      id,
      context,
      status,
      updatedAt,
      ownerId,
      createdAt,
      ,
      checkedAt,
      ,
      approvedAt,
      formId,
    ] = row;
    const parsedContext = parseTaskContext(context);
    if (!id || !formId || !parsedContext) return [];

    return [
      {
        id,
        ownerId: emptyToNull(ownerId) ?? "",
        formId,
        status: toStatus(status),
        createdAt: toDate(createdAt),
        updatedAt: toDate(updatedAt),
        checkedAt: toDate(checkedAt),
        approvedAt: toDate(approvedAt),
        context: parsedContext,
      },
    ];
  });

  const cultureEvals = cultureRows.flatMap((row) => {
    const [
      id,
      cultureRecordId,
      period,
      result,
      levelBehaviorOwner,
      levelBehaviorChecker,
      levelBehaviorApprover,
      actualOwner,
      actualChecker,
      actualApprover,
      fileUrl,
      createdAt,
      updatedAt,
    ] = row;
    if (!id || !cultureRecordId || !isEvaluation1st(period)) return [];

    return [
      {
        id,
        cultureRecordId,
        period: Period.EVALUATION_1ST,
        result: emptyToNull(result),
        levelBehaviorOwner: toInt(levelBehaviorOwner),
        levelBehaviorChecker: toInt(levelBehaviorChecker),
        levelBehaviorApprover: toInt(levelBehaviorApprover),
        actualOwner: emptyToNull(actualOwner),
        actualChecker: emptyToNull(actualChecker),
        actualApprover: emptyToNull(actualApprover),
        fileUrl: emptyToNull(fileUrl),
        createdAt: toDate(createdAt),
        updatedAt: toDate(updatedAt),
      },
    ];
  });

  const competencyEvals = competencyRows.flatMap((row) => {
    const [
      id,
      period,
      result,
      actualOwner,
      levelOwner,
      actualChecker,
      levelChecker,
      actualApprover,
      levelApprover,
      createdAt,
      fileUrl,
      competencyRecordId,
    ] = row;
    if (!id || !competencyRecordId || !isEvaluation1st(period)) return [];

    return [
      {
        id,
        competencyRecordId,
        period: Period.EVALUATION_1ST,
        result: emptyToNull(result),
        actualOwner: emptyToNull(actualOwner),
        levelOwner: toInt(levelOwner),
        actualChecker: emptyToNull(actualChecker),
        levelChecker: toInt(levelChecker),
        actualApprover: emptyToNull(actualApprover),
        levelApprover: toInt(levelApprover),
        createdAt: toDate(createdAt),
        fileUrl: emptyToNull(fileUrl),
      },
    ];
  });

  const comments = commentRows.flatMap((row) => {
    const [
      id,
      formId,
      period,
      commentOwner,
      commentChecker,
      commentApprover,
    ] = row;
    if (!id || !formId || !isEvaluation1st(period)) return [];

    return [
      {
        id,
        formId,
        period: Period.EVALUATION_1ST,
        commentOwner: emptyToNull(commentOwner),
        commentChecker: emptyToNull(commentChecker),
        commentApprover: emptyToNull(commentApprover),
      },
    ];
  });

  console.log(
    `CSV EVALUATION_1ST rows: tasks=${tasks.length}, culture=${cultureEvals.length}, competency=${competencyEvals.length}, comments=${comments.length}`,
  );

  console.log("Connecting to database...");
  await connectSeedDb();
  console.log("Database connected");

  const formIds = [
    ...new Set([
      ...tasks.map((task) => task.formId),
      ...comments.map((comment) => comment.formId),
    ]),
  ];
  const ownerIds = [...new Set(tasks.map((task) => task.ownerId).filter(Boolean))];
  const cultureRecordIds = [
    ...new Set(cultureEvals.map((row) => row.cultureRecordId)),
  ];
  const competencyRecordIds = [
    ...new Set(competencyEvals.map((row) => row.competencyRecordId)),
  ];
  const fileUrls = [
    ...new Set(
      [...cultureEvals, ...competencyEvals]
        .map((row) => row.fileUrl)
        .filter((url): url is string => !!url),
    ),
  ];

  console.log("Loading existing records...");
  const forms = await findInChunks(formIds, (chunk) =>
    db.form.findMany({
      where: { id: { in: chunk } },
      select: { id: true, employeeId: true },
    }),
  );
  const approvals = await findInChunks(ownerIds, (chunk) =>
    db.approval.findMany({
      where: { employeeId: { in: chunk } },
      select: { id: true, employeeId: true },
    }),
  );
  const cultureRecords = await findInChunks(cultureRecordIds, (chunk) =>
    db.cultureRecord.findMany({
      where: { id: { in: chunk } },
      select: { id: true },
    }),
  );
  const competencyRecords = await findInChunks(competencyRecordIds, (chunk) =>
    db.competencyRecord.findMany({
      where: { id: { in: chunk } },
      select: { id: true },
    }),
  );
  const attaches = await findInChunks(fileUrls, (chunk) =>
    db.attach.findMany({
      where: { url: { in: chunk } },
      select: { url: true },
    }),
  );
  const existingTasks = await findInChunks(formIds, (chunk) =>
    db.task.findMany({
      where: { formId: { in: chunk } },
      select: { id: true, formId: true, context: true },
    }),
  );
  const existingCultureEvals = await findInChunks(cultureRecordIds, (chunk) =>
    db.cultureEvaluation.findMany({
      where: {
        cultureRecordId: { in: chunk },
        period: Period.EVALUATION_1ST,
      },
      select: { id: true, cultureRecordId: true, period: true },
    }),
  );
  const existingCompetencyEvals = await findInChunks(
    competencyRecordIds,
    (chunk) =>
      db.competencyEvaluation.findMany({
        where: {
          competencyRecordId: { in: chunk },
          period: Period.EVALUATION_1ST,
        },
        select: { id: true, competencyRecordId: true, period: true },
      }),
  );
  const existingComments = await findInChunks(formIds, (chunk) =>
    db.overallComment.findMany({
      where: {
        formId: { in: chunk },
        period: Period.EVALUATION_1ST,
      },
      select: { id: true, formId: true, period: true },
    }),
  );

  const formById = new Map(forms.map((form) => [form.id, form]));
  const approvalByEmployeeId = new Map(
    approvals.map((approval) => [approval.employeeId, approval.id]),
  );
  const cultureRecordIdsSet = new Set(cultureRecords.map((record) => record.id));
  const competencyRecordIdsSet = new Set(
    competencyRecords.map((record) => record.id),
  );
  const attachUrls = new Set(attaches.map((attach) => attach.url));
  const taskById = new Map(existingTasks.map((task) => [task.id, task]));
  const taskByFormPeriod = new Map(
    existingTasks
      .filter(
        (task) =>
          (task.context as { period?: Period } | null)?.period ===
          Period.EVALUATION_1ST,
      )
      .map((task) => [task.formId, task]),
  );
  const cultureEvalById = new Map(
    existingCultureEvals.map((row) => [row.id, row]),
  );
  const cultureEvalByRecord = new Map(
    existingCultureEvals
      .filter((row) => row.period === Period.EVALUATION_1ST)
      .map((row) => [row.cultureRecordId, row]),
  );
  const competencyEvalById = new Map(
    existingCompetencyEvals.map((row) => [row.id, row]),
  );
  const competencyEvalByRecord = new Map(
    existingCompetencyEvals
      .filter((row) => row.period === Period.EVALUATION_1ST)
      .map((row) => [row.competencyRecordId, row]),
  );
  const commentByForm = new Map(
    existingComments.map((row) => [row.formId, row]),
  );

  let tasksSkipped = 0;
  let cultureSkipped = 0;
  let competencySkipped = 0;
  let commentsSkipped = 0;

  const taskCreates: Array<{
    id: string;
    ownerId: string;
    approvalId: string;
    formId: string;
    status: Status;
    context: { period: Period };
    createdAt?: Date;
    updatedAt?: Date;
    checkedAt: Date | null;
    approvedAt: Date | null;
  }> = [];
  const taskUpdates: Array<{
    id: string;
    data: (typeof taskCreates)[number];
  }> = [];

  for (const task of tasks) {
    const form = formById.get(task.formId);
    if (!form) {
      console.warn(`⚠️ Skipped task ${task.id}: form ${task.formId} not found`);
      tasksSkipped++;
      continue;
    }

    const ownerId = task.ownerId || form.employeeId;
    const approvalId = approvalByEmployeeId.get(ownerId);
    if (!approvalId) {
      console.warn(`⚠️ Skipped task ${task.id}: no approval chain for ${ownerId}`);
      tasksSkipped++;
      continue;
    }

    const existing = taskById.get(task.id) ?? taskByFormPeriod.get(task.formId);
    const data = {
      id: existing?.id ?? task.id,
      ownerId,
      approvalId,
      formId: task.formId,
      status: task.status,
      context: task.context,
      createdAt: task.createdAt ?? undefined,
      updatedAt: task.updatedAt ?? undefined,
      checkedAt: task.checkedAt,
      approvedAt: task.approvedAt,
    };

    if (existing) {
      taskUpdates.push({ id: existing.id, data });
    } else {
      taskCreates.push(data);
    }
  }

  const cultureCreates: Array<{
    id: string;
    cultureRecordId: string;
    period: Period;
    result: string | null;
    levelBehaviorOwner: number | null;
    levelBehaviorChecker: number | null;
    levelBehaviorApprover: number | null;
    actualOwner: string | null;
    actualChecker: string | null;
    actualApprover: string | null;
    fileUrl: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }> = [];
  const cultureUpdates: Array<{
    id: string;
    data: (typeof cultureCreates)[number];
  }> = [];

  for (const row of cultureEvals) {
    if (!cultureRecordIdsSet.has(row.cultureRecordId)) {
      cultureSkipped++;
      continue;
    }

    const existing =
      cultureEvalById.get(row.id) ?? cultureEvalByRecord.get(row.cultureRecordId);
    const data = {
      id: existing?.id ?? row.id,
      cultureRecordId: row.cultureRecordId,
      period: row.period,
      result: row.result,
      levelBehaviorOwner: row.levelBehaviorOwner,
      levelBehaviorChecker: row.levelBehaviorChecker,
      levelBehaviorApprover: row.levelBehaviorApprover,
      actualOwner: row.actualOwner,
      actualChecker: row.actualChecker,
      actualApprover: row.actualApprover,
      fileUrl: row.fileUrl && attachUrls.has(row.fileUrl) ? row.fileUrl : null,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    };

    if (existing) {
      cultureUpdates.push({ id: existing.id, data });
    } else {
      cultureCreates.push(data);
    }
  }

  const competencyCreates: Array<{
    id: string;
    competencyRecordId: string;
    period: Period;
    result: string | null;
    actualOwner: string | null;
    levelOwner: number | null;
    actualChecker: string | null;
    levelChecker: number | null;
    actualApprover: string | null;
    levelApprover: number | null;
    createdAt?: Date;
    fileUrl: string | null;
  }> = [];
  const competencyUpdates: Array<{
    id: string;
    data: (typeof competencyCreates)[number];
  }> = [];

  for (const row of competencyEvals) {
    if (!competencyRecordIdsSet.has(row.competencyRecordId)) {
      competencySkipped++;
      continue;
    }

    const existing =
      competencyEvalById.get(row.id) ??
      competencyEvalByRecord.get(row.competencyRecordId);
    const data = {
      id: existing?.id ?? row.id,
      competencyRecordId: row.competencyRecordId,
      period: row.period,
      result: row.result,
      actualOwner: row.actualOwner,
      levelOwner: row.levelOwner,
      actualChecker: row.actualChecker,
      levelChecker: row.levelChecker,
      actualApprover: row.actualApprover,
      levelApprover: row.levelApprover,
      createdAt: row.createdAt ?? undefined,
      fileUrl: row.fileUrl && attachUrls.has(row.fileUrl) ? row.fileUrl : null,
    };

    if (existing) {
      competencyUpdates.push({ id: existing.id, data });
    } else {
      competencyCreates.push(data);
    }
  }

  const commentCreates: Array<{
    id: string;
    formId: string;
    period: Period;
    commentOwner: string | null;
    commentChecker: string | null;
    commentApprover: string | null;
  }> = [];
  const commentUpdates: Array<{
    id: string;
    data: Omit<(typeof commentCreates)[number], "id" | "formId" | "period">;
  }> = [];

  for (const comment of comments) {
    if (!formById.has(comment.formId)) {
      commentsSkipped++;
      continue;
    }

    const existing = commentByForm.get(comment.formId);
    if (existing) {
      commentUpdates.push({
        id: existing.id,
        data: {
          commentOwner: comment.commentOwner,
          commentChecker: comment.commentChecker,
          commentApprover: comment.commentApprover,
        },
      });
    } else {
      commentCreates.push({
        id: comment.id,
        formId: comment.formId,
        period: Period.EVALUATION_1ST,
        commentOwner: comment.commentOwner,
        commentChecker: comment.commentChecker,
        commentApprover: comment.commentApprover,
      });
    }
  }

  console.log(
    `Writing: tasks +${taskCreates.length}/~${taskUpdates.length}, culture +${cultureCreates.length}/~${cultureUpdates.length}, competency +${competencyCreates.length}/~${competencyUpdates.length}, comments +${commentCreates.length}/~${commentUpdates.length}`,
  );

  const txOptions = { timeout: 120_000, maxWait: 60_000 };

  console.log("Writing tasks...");
  await runInChunks(taskCreates, 50, async (chunk) => {
    await db.task.createMany({ data: chunk });
  });
  await runInChunks(taskUpdates, 10, async (chunk) => {
    await db.$transaction(async (tx) => {
      for (const { id, data } of chunk) {
        const { id: _id, ...updateData } = data;
        await tx.task.update({ where: { id }, data: updateData });
      }
    }, txOptions);
  });

  console.log("Writing culture evaluations...");
  await runInChunks(cultureCreates, 50, async (chunk) => {
    await db.cultureEvaluation.createMany({ data: chunk });
  });
  await runInChunks(cultureUpdates, 10, async (chunk) => {
    await db.$transaction(async (tx) => {
      for (const { id, data } of chunk) {
        const { id: _id, ...updateData } = data;
        await tx.cultureEvaluation.update({ where: { id }, data: updateData });
      }
    }, txOptions);
  });

  console.log("Writing competency evaluations...");
  await runInChunks(competencyCreates, 50, async (chunk) => {
    await db.competencyEvaluation.createMany({ data: chunk });
  });
  await runInChunks(competencyUpdates, 10, async (chunk) => {
    await db.$transaction(async (tx) => {
      for (const { id, data } of chunk) {
        const { id: _id, ...updateData } = data;
        await tx.competencyEvaluation.update({
          where: { id },
          data: updateData,
        });
      }
    }, txOptions);
  });

  console.log("Writing overall comments...");
  await runInChunks(commentCreates, 50, async (chunk) => {
    await db.overallComment.createMany({ data: chunk });
  });
  await runInChunks(commentUpdates, 10, async (chunk) => {
    await db.$transaction(async (tx) => {
      for (const { id, data } of chunk) {
        await tx.overallComment.update({ where: { id }, data });
      }
    }, txOptions);
  });

  const tasksCreated = taskCreates.length;
  const tasksUpdated = taskUpdates.length;
  const cultureCreated = cultureCreates.length;
  const cultureUpdated = cultureUpdates.length;
  const competencyCreated = competencyCreates.length;
  const competencyUpdated = competencyUpdates.length;
  const commentsUpserted = commentCreates.length + commentUpdates.length;

  console.log(
    `✅ EVALUATION_1ST seed done
  tasks     created=${tasksCreated} updated=${tasksUpdated} skipped=${tasksSkipped}
  culture   created=${cultureCreated} updated=${cultureUpdated} skipped=${cultureSkipped}
  competency created=${competencyCreated} updated=${competencyUpdated} skipped=${competencySkipped}
  comments  upserted=${commentsUpserted} skipped=${commentsSkipped}`,
  );

  return {
    tasksCreated,
    tasksUpdated,
    tasksSkipped,
    cultureCreated,
    cultureUpdated,
    cultureSkipped,
    competencyCreated,
    competencyUpdated,
    competencySkipped,
    commentsUpserted,
    commentsSkipped,
  };
};

const isDirectRun = process.argv[1]?.includes("seed-merit-evaluation-1st");

if (isDirectRun) {
  (async () => {
    let failed = false;
    try {
      await seedMeritEvaluation1st();
    } catch (error) {
      console.error(error);
      failed = true;
    } finally {
      await disconnectSeedDb().catch(() => undefined);
      process.exit(failed ? 1 : 0);
    }
  })();
}
