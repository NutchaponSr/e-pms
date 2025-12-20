import { Task } from "@/generated/prisma/client";
import { Status } from "@/generated/prisma/enums";

export interface PermissionContext {
  employeeId: string;
  ownerId: string;
  checkerId: string | null;
  approverId: string;
  status: Status;
}


export type Approval = "owner" | "checker" | "approver";
export type Action = "write" | "read";

const permissions: Record<Status, Record<Approval, Action[]>> = {
  [Status.NOT_STARTED]: {
    owner: ["write", "read"],
    checker: ["read"],
    approver: ["read"],
  },
  [Status.IN_DRAFT]: {
    owner: ["write", "read"],
    checker: ["read"],
    approver: ["read"],
  },
  [Status.PENDING_CHECKER]: {
    owner: ["read"],
    checker: ["write", "read"],
    approver: ["read"],
  },
  [Status.REJECTED_BY_CHECKER]: {
    owner: ["write", "read"],
    checker: ["read"],
    approver: ["read"],
  },
  [Status.PENDING_APPROVER]: {
    owner: ["read"],
    checker: ["read"],
    approver: ["write", "read"],
  },
  [Status.REJECTED_BY_APPROVER]: {
    owner: ["write", "read"],
    checker: ["read"],
    approver: ["read"],
  },
  [Status.DONE]: {
    owner: ["read"],
    checker: ["read"],
    approver: ["read"],
  },
} 

export function canPerform(role: Approval, action: Action[], status: Status): boolean {
  const permission = permissions[status]?.[role] || [];
  return action.every(action => permission.includes(action));
}

export function getUserRole(context: PermissionContext): Approval | null {
  const { employeeId, ownerId, checkerId, approverId } = context;

  if (employeeId === ownerId) {
    return "owner";
  }

  if (checkerId && employeeId === checkerId) {
    return "checker";
  }

  if (employeeId === approverId) {
    return "approver";
  }

  return null;
}

export function canPerforms(
  role: Approval,
  actions: Action[],
  status: Status
): Record<Action, boolean> {
  const permission = permissions[status]?.[role] || [];
  return actions.reduce(
    (acc, action) => {
      acc[action] = permission.includes(action);
      return acc;
    },
    {} as Record<Action, boolean>
  );
}

export function buildPermissionContext(employeeId: string, task: Task): PermissionContext {
  return {
    employeeId,
    ownerId: task.ownerId,
    checkerId: task.checkerId,
    approverId: task.approverId,
    status: task.status,
  };
}