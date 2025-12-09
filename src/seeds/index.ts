import "dotenv/config";

import { clear } from "./clear";
import { seedEmployee } from "./seed-employee";

async function seed() {
  await clear();
  await seedEmployee();
}

(async () => {
  try {
    await seed();
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
})();