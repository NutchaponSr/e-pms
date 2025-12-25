import "dotenv/config";

import { clear } from "./clear";
import { seedCulture } from "./seed-culture";
import { seedEmployee } from "./seed-employee";
import { seedCompetencies } from "./seed-competency";

async function seed() {
  await clear();
  await seedEmployee();

  await seedCompetencies();
  await seedCulture();
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