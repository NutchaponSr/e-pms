import { JSX, useState } from "react";

import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const useConfirm = ({
  className = "w-100",
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Continue",
  confirmVariant = "dangerOutline",
  cancelVariant = "mutedOultine"
}: {
  title?: string;
  description?: string;
  className?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary" | "primaryGhost" | "dangerOutline" | "mutedOultine";
  cancelVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary" | "primaryGhost" | "dangerOutline" | "mutedOultine";
}): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirmStart = () => new Promise((resolve) => {
    setPromise({ resolve });
  });

  const handleClose = () => {
    setPromise(null);
  }

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  }

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  }

  const ConfirmationDialog = () => (
    <Dialog open={promise !== null} modal={false}>
      <DialogContent showCloseButton={false} className={cn(className)}>
        <DialogHeader className="flex flex-col relative gap-2 items-center w-full">
          <DialogTitle>
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col w-full space-y-1.5">
          <Button variant={confirmVariant} onClick={handleConfirm} className="font-normal h-8">
            {confirmLabel}
          </Button>
          <Button variant={cancelVariant} onClick={handleCancel} className="font-normal h-8">
            {cancelLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return [ConfirmationDialog, confirmStart]
} 