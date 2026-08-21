import "server-only";

import { TRPCError } from "@trpc/server";

import db from "@/lib/db";
import { Period, UserRole } from "@/generated/prisma/enums";

import { Action, buildPermissionContext, canPerform, getUserRole } from "./permissions";
import { getApprovalChain, taskChainInclude } from "./chain";

/** Admin สามารถทำงานแทนเจ้าของฟอร์ม (role = owner) ได้ทุกฟอร์ม */
export async function isAdminUser(username: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { username },
    select: { role: true },
  });

  return user?.role === UserRole.ADMIN;
}

export async function assertFormOwner(formId: string, username: string) {
  const form = await db.form.findUnique({
    where: { id: formId },
    select: { employeeId: true },
  });

  if (!form) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No permission to modify this form" });
  }

  if (form.employeeId === username) return;

  if (await isAdminUser(username)) return;

  throw new TRPCError({ code: "FORBIDDEN", message: "No permission to modify this form" });
}

export async function requireTaskRole(
  formId: string,
  period: Period,
  username: string,
  actions: Action[],
) {
  const task = await db.task.findFirst({
    where: {
      formId,
      context: { path: ["period"], equals: period },
    },
    include: taskChainInclude,
  });

  if (!task) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
  }

  const chain = getApprovalChain(task);
  let role = getUserRole(buildPermissionContext(username, chain, task.status));

  if (!role && (await isAdminUser(username))) {
    role = "owner";
  }

  if (!role || !canPerform(role, actions, task.status)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No permission to perform this action" });
  }

  return { task, role };
}

export async function hasAnyRoleOnForm(formId: string, username: string): Promise<boolean> {
  const form = await db.form.findUnique({
    where: { id: formId },
    select: { employeeId: true },
  });

  if (!form) return false;

  if (form.employeeId === username) return true;

  const task = await db.task.findFirst({
    where: {
      formId,
      OR: [
        { approval: { checkerId: username } },
        { approval: { approverId: username } },
      ],
    },
    select: { id: true },
  });

  if (task) return true;

  return await isAdminUser(username);
}

export async function assertAnyRoleOnForm(formId: string, username: string) {
  if (!(await hasAnyRoleOnForm(formId, username))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No permission to access this form" });
  }
}
