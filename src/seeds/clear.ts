import db from "@/lib/db";

export const clear = async () => {
  console.log("Clearing database...");

  await db.$transaction([
    db.user.deleteMany(),
    db.employee.deleteMany(), 
  ]);

  console.log("Database cleared successfully");
}