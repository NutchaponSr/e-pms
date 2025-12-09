import { db } from "@/db";
import { employee, user } from "@/db/schema";

export const clear = async () => {
  console.log("Clearing database...");

  await db.delete(user);
  await db.delete(employee);

  console.log("Database cleared successfully");
}