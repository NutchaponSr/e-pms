import bcrypt from "bcryptjs";

import { betterAuth } from "better-auth";
import { admin, username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import { ac, roles } from "@/lib/permission";
import { role } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 5,
    autoSignIn: false,
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              email: user.email === "t@somboon.co.th" ? undefined : user.email,
            }
          }
        }
      }
    }
  },
  user: {
    additionalFields: {
      employeeId: {
        type: "string",
        required: false,
        input: false,
      },
      role: {
        type: ["USER", "ADMIN"],
        input: false,
      }
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 10,
    },
  },
  plugins: [
    username(),
    admin({
      ac,
      roles,
      defaultRole: role.enumValues[0],
      adminRoles: [role.enumValues[1]],
    })
  ],
});