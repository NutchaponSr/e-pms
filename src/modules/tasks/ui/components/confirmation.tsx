import { useEffect, useRef } from "react";
import { useConfirm } from "@/hooks/use-confirm";

import { Period } from "@/generated/prisma/enums";

import { Button } from "@/components/ui/button";

import { useSaveForm } from "@/modules/tasks/stores/use-save-form";
import { useConfirmation } from "@/modules/tasks/api/use-confirmation";

interface Props {
  id: string;
  taskId: string;
  period: Period;
  app: string;
  confirmTitle?: string;
  onSave?: () => void;
}

export const Confirmation = ({ id, taskId, period, confirmTitle, onSave, app }: Props) => {
  const { save } = useSaveForm();
  const { mutation: confirmation, ctx } = useConfirmation(id, period);

  const [ConfirmationDialog, confirm] = useConfirm({
    title: confirmTitle,
    description: "Are you sure you want to confirm this task?",
    confirmVariant: "primary"
  });

  const [SaveWarningDialog, confirmSave] = useConfirm({
    title: "Form Not Saved",
    description: "Please save the form before confirming. Do you want to save now?",
    confirmLabel: "Save and Continue",
    cancelLabel: "Cancel",
    confirmVariant: "primary"
  });

  return (
    <div className="transition-opacity opacity-100 relative">
      <div className="absolute bottom-5 translate-x-[calc(-50%+120px)] left-1/2 z-9999 dark:shadow-[0_3px_18px_0px_#00000008] w-[30%] isolation-auto flex items-center justify-between flex-row p-3 rounded-md border border-[#e6e5e3] dark:border-[#383836] backdrop-blur-xl dark:bg-[#32302c] gap-3 bg-[#5448310a] shadow-[0_3px_18px_0px_#00000008]">
        <div className="flex items-center gap-2">
          <div className="flex items-start flex-col">
            <div className="text-sm leading-5">
              {app}
            </div>
            <div className="text-xs leading-4 text-tertiary">
              confirmation
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConfirmationDialog />
          <SaveWarningDialog />
          <Button 
            type="button"
            variant="primary"
            onClick={async () => {
              if (!save) {
                const shouldSave = await confirmSave();
                
                if (shouldSave && onSave) {
                  onSave();
                  confirmation({ id: taskId, approved: true });
                }
              } else {
                const ok = await confirm();

                if (ok) {
                  confirmation({ id: taskId, approved: true });
                }
              }
            }}
            disabled={ctx.isPending}
          >
            Confirm
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={async () => {
              const ok = await confirm();

              if (ok) {
                confirmation({ id: taskId, approved: false });
              }
            }}
            disabled={ctx.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};