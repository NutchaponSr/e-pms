import { toast } from "sonner";

import { CompetencyType, Period } from "@/generated/prisma/enums";

import { useExcelParser } from "@/hooks/use-excel-parser";

import { ErrorsToast } from "@/components/errors-toast";

import { 
  formatMeritValidationErrors, 
  validateMeritUpload,
} from "@/modules/merit/utils";
import { useDefinitionBulkMerit } from "@/modules/merit/api/use-definition-bulk-merit";
import { MeritDefinition } from "@/modules/merit/schemas/definition";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

interface Props {
  id: string;
  period: Period;
  fileRef: React.RefObject<HTMLInputElement>;
  competencyRecords: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"]["competencyRecords"];
  cultureRecords: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"]["cultureRecords"];
}

export const MeritUpload = ({ fileRef, period, id, competencyRecords, cultureRecords }: Props) => {
  const trpc = useTRPC();

  // Query master data for validation
  const { data: masterCompetencies } = useQuery(trpc.competency.getMany.queryOptions({ 
    types: [CompetencyType.CC, CompetencyType.FC, CompetencyType.MC, CompetencyType.TC]  
  }));

  const { data: masterCultures } = useQuery(trpc.culture.getMany.queryOptions());

  const { handleFileParsing } = useExcelParser();
  const { mutation: definitionBulkMerit } = useDefinitionBulkMerit(id, period);

  return (
    <input 
      type="file"
      ref={fileRef}
      className="sr-only"
      accept=".xlsx,.xls,.csv"
      onChange={async () => {
        const file = fileRef.current?.files?.[0];

        if (!file) return;

        try {
          // Parse sheet 0 (Competency) and sheet 1 (Culture)
          const competencySheet = await handleFileParsing(file, 0);
          const cultureSheet = await handleFileParsing(file, 1);

          if (competencySheet.length === 0 && cultureSheet.length === 0) {
            toast.error("Excel file has no data");
            return;
          }

          const { competencyErrors, validCompetencies, cultureErrors, validCultures } = 
            validateMeritUpload(competencySheet, cultureSheet);

          const allErrors = [...competencyErrors, ...cultureErrors];

          if (allErrors.length > 0) {
            const formattedErrors = formatMeritValidationErrors(competencyErrors, cultureErrors);
            toast.error(<ErrorsToast title="Validation Failed" errors={formattedErrors} maxVisible={3} />, {
              duration: 15000,
              className: "w-auto max-w-2xl",
            });

            return;
          }

          // Validate against master data
          if (!masterCompetencies || masterCompetencies.length === 0) {
            toast.error("Competencies data not loaded");
            return;
          }

          if (!masterCultures || masterCultures.length === 0) {
            toast.error("Cultures data not loaded");
            return;
          }

          // Create maps for quick lookup
          const masterCompetencyMap = new Map(
            masterCompetencies.map((comp) => [comp.id, comp])
          );
          const masterCultureMap = new Map(
            masterCultures.map((cult) => [cult.code, cult])
          );

          // Validate competency IDs exist in master data
          const invalidCompetencyIds = validCompetencies.filter(
            (comp) => !masterCompetencyMap.has(comp.competencyId)
          );
          if (invalidCompetencyIds.length > 0) {
            toast.error(
              `Invalid competency IDs: ${invalidCompetencyIds.map((c) => c.competencyId).join(", ")}`
            );
            return;
          }

          // Validate culture codes exist in master data
          const invalidCultureCodes = validCultures.filter(
            (cult) => !masterCultureMap.has(cult.code)
          );
          if (invalidCultureCodes.length > 0) {
            toast.error(
              `Invalid culture codes: ${invalidCultureCodes.map((c) => c.code).join(", ")}`
            );
            return;
          }

          // Sort records by order to match with upload data sequentially
          const sortedCompetencyRecords = [...competencyRecords].sort((a, b) => (a.order || 0) - (b.order || 0));
          
          // Match competencies by order/index (since competencyId might be null)
          if (validCompetencies.length > sortedCompetencyRecords.length) {
            throw new Error(`Upload has ${validCompetencies.length} competencies but form only has ${sortedCompetencyRecords.length} competency records`);
          }

          const competenciesData: MeritDefinition["competencies"] = validCompetencies
            .map((competency, index) => {
              const record = sortedCompetencyRecords[index];
              
              if (!record) {
                throw new Error(`Competency record at index ${index} not found`);
              }
              
              return {
                id: record.id,
                competencyId: competency.competencyId,
                input: competency.input,
                output: competency.output,
                weight: competency.weight,
                expectedLevel: competency.expectedLevel,
              };
            })
            .filter((comp) => comp.id);

          // Use culture.code as key to match with upload data
          const cultureRecordMap = new Map(
            cultureRecords.map((record) => [record.culture.code, record])
          );

          const culturesData: MeritDefinition["cultures"] = validCultures
            .map((culture) => {
              const record = cultureRecordMap.get(culture.code);
              if (!record) {
                throw new Error(`Culture with code ${culture.code} not found`);
              }
              return {
                id: record.id,
                evidence: culture.evidence,
              };
            })
            .filter((cult) => cult.id);

          definitionBulkMerit({ 
            competencies: competenciesData, 
            cultures: culturesData, 
            saved: false 
          });
        } catch (error) {
          console.error(error);
          toast.error(error instanceof Error ? error.message : "An error occurred while reading the file");
        } finally {
          if (fileRef.current) {
            fileRef.current.value = "";
          }
        }
      }}
    />
  );
};
