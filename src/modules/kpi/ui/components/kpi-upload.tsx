import { toast } from "sonner";

import { Period } from "@/generated/prisma/enums";

import { useExcelParser } from "@/hooks/use-excel-parser";

import { ErrorsToast } from "@/components/errors-toast";

import { 
  formatValidationErrors, 
  validateKpiUpload,
} from "@/modules/kpi/utils";
import { useCreateBulkKpis } from "@/modules/kpi/api/use-create-bulk-kpis";

interface Props {
  id: string;
  period: Period;
  fileRef: React.RefObject<HTMLInputElement>;
}

export const KpiUpload = ({ fileRef, period, id }: Props) => {
  const { handleFileParsing } = useExcelParser();
  const createBulkKpis = useCreateBulkKpis(period);

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
          const sheet = await handleFileParsing(file, 0);

          if (sheet.length === 0) {
            toast.error("Excel file has no data");
            return;
          }

          const { errors, validKpis } = validateKpiUpload(sheet);

          if (errors.length > 0) {
            const formattedErrors = formatValidationErrors(errors);
            toast.error(<ErrorsToast title="Validation Failed" errors={formattedErrors} maxVisible={3} />, {
              duration: 15000,
              className: "w-auto max-w-2xl",
            });

            return;
          }

          createBulkKpis({ formId: id, kpis: validKpis });
        } catch (error) {
          console.error(error)
          toast.error(error instanceof Error ? error.message : "An error occurred while reading the file")
        } finally {
          if (fileRef.current) {
            fileRef.current.value = "";
          }
        }
      }}
    />
  );
}