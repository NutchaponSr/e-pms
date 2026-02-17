import { createAccessControl } from "better-auth/plugins/access";

import { UserRole } from "@/generated/prisma/enums";

const statements = {
  backend: ["access"],
} as const;

export const ac = createAccessControl(statements);

export const roles = {
  [UserRole.ADMIN]: ac.newRole({
    backend: ["access"],
  }),
  [UserRole.USER]: ac.newRole({
    backend: [],
  }),
};