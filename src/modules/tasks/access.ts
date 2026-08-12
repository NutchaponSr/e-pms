import "server-only";

import { TRPCError } from "@trpc/server";

import db from "@/lib/db";
import { Period } from "@/generated/prisma/enums";

import { Action, buildPermissionContext, canPerform, getUserRole } from "./permissions";

export async function assertFormOwner(formId: string, username: string) {
  const form = await db.form.findUnique({
    where: { id: formId },
    select: { employeeId: true },
  });

  if (!form || form.employeeId !== username) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No permission to modify this form" });
  }
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
  });

  if (!task) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
  }

  const role = getUserRole(buildPermissionContext(username, task));

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

  if (form?.employeeId === username) return true;

  const tasks = await db.task.findMany({ where: { formId } });
  return tasks.some((task) => getUserRole(buildPermissionContext(username, task)) !== null);
}

export async function assertAnyRoleOnForm(formId: string, username: string) {
  if (!(await hasAnyRoleOnForm(formId, username))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No permission to access this form" });
  }
}
