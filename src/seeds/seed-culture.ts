import db from "@/lib/db";

import cultures from "@/culture.json";

const CULTURE_ID_START = 16;

export const seedCulture = async () => {
  await db.culture.createMany({
    data: cultures.map((culture, index) => ({
      id: CULTURE_ID_START + index,
      name: culture.cultureName,
      code: culture.cultureCode,
      description: culture.description,
      belief: culture.beliefs,
    })),
  });

  console.log(`✅ Seeded ${cultures.length} cultures`);
}