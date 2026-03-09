import path from "path";
import db from "@/lib/db";

import { authClient } from "@/lib/auth-client";

import { readCSV } from "@/seeds/lib/utils";

interface EmployeeCVSProps {
  order: number;
  id: string;
  fullName: string;
  position: string;
  division: string;
  level: string;
  rank: string;
  department: string;
  email?: string;
  password: string;
}

export const seedEmployee = async () => {
  console.log("Seeding employee...");

  const file = path.join(process.cwd(), "src/data", "employee.csv");

  const records = readCSV<EmployeeCVSProps>(file, (value, context) => {
    if (context.column === "password") {
      const str = String(value).trim();
      // รองรับกรณีเลข 0 นำหน้าโดนตัด เช่น 8440 -> 08440
      return str.padStart(5, "0");
    }

    // id เก็บเป็น string เพื่อรักษา leading zero (เช่น 0001)
    if (context.column === "order") return Number(value);
    if (context.column === "id") return String(value).trim();

    return value;
  });

  if (!records.length) {
    console.log("No data found");
    return [];
  }
  
  for (const record of records) {
   await db.employee.create({
    data: {
      id: record.id.toString(),
      name: record.fullName,
      email: record.email,
      position: record.position,
      division: record.division,
      level: record.level,
      rank: record.rank,
      department: record.department,
    },
   });
  }

  await Promise.all(records.map(async record => {
    await authClient.signUp.email({
        email: record.email || "t@somboon.co.th",
        name: record.fullName,
        password: record.password,
        username: record.id.toString(),
      }, {
      onError: (error) => {
        console.error(`❌ Failed to create user for ${record.id}:`, error.error?.message || error);
      }
    });
  }));

  // Admin account 
  // await db.employee.create({
  //   data: {
  //     id: "admin",
  //     name: "Admin",
  //     position: "admin",
  //     division: "SAT",
  //     level: "MGR",
  //     rank: "MGR",
  //     department: "สำนักรองกรรมการผู้อำนวยการ - สายงานทรัพยากรบุคคล",
  //   },
  // });

  // await authClient.signUp.email({
  //   email: "t@somboon.co.th",
  //   name: "Admin",
  //   password: "admin12345",
  //   username: "admin",
  // });

  console.log("Employee seeded successfully");
}