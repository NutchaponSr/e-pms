import path from "path";
import db from "@/lib/db";

import { readCSV } from "@/seeds/lib/utils";
import { CompetencyType } from "@/generated/prisma/enums";

type Competency = {
  id: string;
  name: string;
  definition: string | null;
  t1: string | null;
  t2: string | null;
  t3: string | null;
  t4: string | null;
  t5: string | null;
  type: CompetencyType;
}

export const seedCompetencies = async () => {
  console.log("Seeding competencies...");

  const file = path.join(process.cwd(), "src/data", "competency.csv");
  const records = readCSV<Competency>(file, (value, context) => {
    if (["order"].includes(String(context.column))) return Number(value);
    return value;
  });

  if (!records.length) {
    console.warn("⚠️ No competency records found");
    return [];
  }

  const competencies: Competency[] = [];

  for (const record of records) {
    const competency = await db.competency.create({
      data: {
        id: String(record.id),
        name: record.name,
        definition: record.definition,
        t1: record.t1,
        t2: record.t2,
        t3: record.t3,
        t4: record.t4,
        t5: record.t5,
        type: record.type
      },
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });
    
    competencies.push(competency);
  }

  console.log(`✅ Created ${competencies.length} competencies`);
}