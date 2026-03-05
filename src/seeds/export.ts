import "dotenv/config";

import os from "os";
import path from "path";

import db from "@/lib/db";
import { writeCSV } from "./lib/utils";

const desktopDir = path.join(os.homedir(), "Desktop");

async function exportData() {
  // const users = await db.user.findMany();
  // const accounts = await db.account.findMany();
  const competencies = await db.competency.findMany();
  const cultures = await db.culture.findMany();

  // const userPath = writeCSV("users.csv", users, undefined, desktopDir);
  // const accountPath = writeCSV("accounts.csv", accounts, undefined, desktopDir);
  const competencyPath = writeCSV("competencies.csv", competencies, undefined, desktopDir);
  const culturePath = writeCSV("cultures.csv", cultures, undefined, desktopDir);

  // console.log("Exported:", userPath);
  // console.log("Exported:", accountPath);
  console.log("Exported:", competencyPath);
  console.log("Exported:", culturePath);
}

(async () => {
  try {
    await exportData();
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
})();