export type EvaluationRole = "owner" | "checker" | "approver";

/** เลือกเฉพาะ field ของ overall comment ที่ role นั้นมีสิทธิ์แก้ */
export function buildOverallCommentRoleUpdate(
  comments: {
    commentOwner: string | null;
    commentChecker: string | null;
    commentApprover: string | null;
  },
  role: EvaluationRole,
) {
  switch (role) {
    case "owner":
      return { commentOwner: comments.commentOwner };
    case "checker":
      return { commentChecker: comments.commentChecker };
    case "approver":
      return { commentApprover: comments.commentApprover };
  }
}

/** จัดกลุ่ม comment ตาม record ที่ผูกอยู่ (connectId) */
export function groupByConnectId<T extends { connectId: string }>(
  comments: T[],
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const comment of comments) {
    (grouped[comment.connectId] ??= []).push(comment);
  }
  return grouped;
}

/** แปลง empty string เป็น null ทุก field (ค่าจากฟอร์มมักส่ง "" มาแทนการไม่กรอก) */
export function normalizeEmptyStringToNull<T extends Record<string, unknown>>(
  obj: T,
): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}
