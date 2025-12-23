import db from "@/lib/db";

import cultures from "@/culture.json";

export const seedCulture = async () => {
  await db.culture.createMany({
    data: cultures.map(culture => ({
      name: culture.cultureName,
      code: culture.cultureCode,
      description: culture.description,
      belief: culture.beliefs
    }))
  });

  console.log(`✅ Seeded ${cultures.length} cultures`);
}