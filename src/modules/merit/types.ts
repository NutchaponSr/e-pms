import { 
  Competency, 
  CompetencyEvaluation, 
  CompetencyRecord, 
  Culture, 
  CultureEvaluation, 
  CultureRecord, 
  Employee, 
  Form 
} from "@/generated/prisma/client";

export interface MeritFormWithInfo extends Form {
  competencyRecords: (CompetencyRecord & {
    competency: Competency | null;
    competencyEvaluations: CompetencyEvaluation[];
  })[];
  cultureRecords: (CultureRecord & {
    culture: Culture;
    cultureEvaluations: CultureEvaluation[];
  })[];
  employee: Employee;
}