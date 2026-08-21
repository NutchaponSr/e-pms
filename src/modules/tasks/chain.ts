import type { Approval, Employee, Task } from "@/generated/prisma/client";

export const taskChainInclude = {
  owner: true,
  approval: {
    include: {
      checker: true,
      approver: true,
    },
  },
} as const;

export type TaskWithChain = Task & {
  owner: Employee;
  approval: Approval & {
    checker: Employee | null;
    approver: Employee;
  };
};

export type ApprovalChain = {
  ownerId: string;
  checkerId: string | null;
  approverId: string;
  owner: Employee;
  checker: Employee | null;
  approver: Employee | null;
};

export function getApprovalChain(task: TaskWithChain): ApprovalChain {
  return {
    ownerId: task.ownerId,
    checkerId: task.approval.checkerId,
    approverId: task.approval.approverId,
    owner: task.owner,
    checker: task.approval.checker,
    approver: task.approval.approver,
  };
}

export function withTaskChain<T extends object>(task: T, chain: ApprovalChain) {
  return {
    ...task,
    ownerId: chain.ownerId,
    checkerId: chain.checkerId,
    approverId: chain.approverId,
    owner: chain.owner,
    checker: chain.checker ?? undefined,
    approver: chain.approver ?? undefined,
  };
}
