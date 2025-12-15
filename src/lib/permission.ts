import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

import { UserRole } from "@/generated/prisma/enums";

const statements = {
  ...defaultStatements,
  backend: ["access"],
  tasks: ["create", "read", "update", "delete", "update:own", "delete:own"], 
} as const;

export const ac = createAccessControl(statements);

export const roles = {
  [UserRole.ADMIN]: ac.newRole({
    backend: ["access"],
    tasks: ["create", "read", "update", "delete", "update:own", "delete:own"],
    ...adminAc.statements,
  }),
  [UserRole.USER]: ac.newRole({
    backend: [],
    tasks: ["create", "read", "update:own", "delete:own"],
  }),
};