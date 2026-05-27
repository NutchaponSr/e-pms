import { 
  Competency, 
  CompetencyEvaluation, 
  CompetencyRecord, 
  Culture, 
  CultureEvaluation, 
  CultureRecord, 
  Employee, 
  Form, 
  MeritOverallComment,
  Task
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

export interface MeritDefinitionWithTasks extends MeritFormWithInfo {
  task: Task & {
    checker?: Employee;
    approver: Employee;
  };
  overallComments?: MeritOverallComment[];
}