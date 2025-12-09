import { relations } from "drizzle-orm";
import { boolean, index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const role = pgEnum("role", ["USER", "ADMIN"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  role: role("role").default("USER").notNull(),
  username: text("username").notNull(),
  displayUsername: text("displayUsername"),
  banned: boolean("banned").default(false).notNull(),
  bannedReason: text("bannedReason"),
  bannedAt: timestamp("bannedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
}, (table) => [index("sessionUserIdIdx").on(table.userId)]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
}, (table) => [index("accountUserIdIdx").on(table.userId)]);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  employee: one(employee, {
    fields: [user.username],
    references: [employee.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const employee = pgTable("employee", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  position: text("position"),
  division: text("division"),
  level: text("level"),
  rank: text("rank"),
  department: text("department"),
}); 

export const employeeRelations = relations(employee, ({ one }) => ({
  user: one(user, {
    fields: [employee.id],
    references: [user.username],
  }),
}));