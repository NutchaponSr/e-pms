import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

import { role } from "@/db/schema";

const statements = {
  ...defaultStatements,
  backend: ["access"],
  tasks: ["create", "read", "update", "delete", "update:own", "delete:own"], 
} as const;

export const ac = createAccessControl(statements);

export const roles = {
  [role.enumValues[1]]: ac.newRole({
    backend: ["access"],
    tasks: ["create", "read", "update", "delete", "update:own", "delete:own"],
    ...adminAc.statements,
  }),
  [role.enumValues[0]]: ac.newRole({
    backend: [],
    tasks: ["create", "read", "update:own", "delete:own"],
  }),
};