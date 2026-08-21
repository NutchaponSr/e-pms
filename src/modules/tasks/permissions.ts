import { Status } from "@/generated/prisma/enums";

export interface PermissionContext {
  employeeId: string;
  ownerId: string;
  checkerId: string | null;
  approverId: string;
  status: Status;
}

type ApprovalChainIds = Pick<
  PermissionContext,
  "ownerId" | "checkerId" | "approverId"
>;


export type Approval = "owner" | "checker" | "approver";
export type Action = "write" | "read" | "start-workflow" | "approve" | "delete";

const permissions: Record<Status, Record<Approval, Action[]>> = {
  [Status.NOT_STARTED]: {
    owner: ["write", "read"],
    checker: ["read"],
    approver: ["read"],
  },
  [Status.IN_DRAFT]: {
    owner: ["write", "read", "start-workflow", "delete"],
    checker: ["read"],
    approver: ["read"],
  },
  [Status.WAITING_APPROVER_1]: {
    owner: ["read"],
    checker: ["write", "read", "approve"],
    approver: ["read"],
  },
  [Status.WAITING_APPROVER_2]: {
    owner: ["read"],
    checker: ["read"],
    approver: ["write", "read", "approve"],
  },
  [Status.COMPLETED]: {
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
  const { employeeId, ownerId, checkerId, approverId, status } = context;

  if (employeeId === ownerId) {
    return "owner";
  }

  const isChecker = Boolean(checkerId && employeeId === checkerId);
  const isApprover = employeeId === approverId;

  if (isChecker && isApprover && checkerId === approverId) {
    if (status === Status.WAITING_APPROVER_2) {
      return "approver";
    }
    return "checker";
  }

  if (isChecker) {
    return "checker";
  }

  if (isApprover) {
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

export function buildPermissionContext(
  employeeId: string,
  chain: ApprovalChainIds,
  status: Status,
): PermissionContext {
  return {
    employeeId,
    ownerId: chain.ownerId,
    checkerId: chain.checkerId,
    approverId: chain.approverId,
    status,
  };
}