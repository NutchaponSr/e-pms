import { ChevronDownIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BsFiletypeCsv, BsFloppy2Fill, BsSave, BsUpload } from "react-icons/bs";
import { EMPLOYEE_INFO_HEIGHT_VAR } from "@/components/employee-info";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import type { Action } from "@/modules/tasks/permissions";
import type { StatusVariant } from "@/modules/tasks/types";

function getScrollParent(node: HTMLElement | null) {
  let parent = node?.parentElement ?? null;

  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }

  return null;
}

interface Props {
  status: {
    label: string;
    variant: StatusVariant;
  };
  onCreate?: () => void;
  onWorkflow: () => void | Promise<void>;
  onSaveDraft: () => void;
  onBeforeFinalSubmit?: () => void;
  onUpload?: () => void;
  onExport?: () => void;
  permissions: Record<Action, boolean>;
}

export const Toolbar = ({
  status,
  onCreate,
  onWorkflow,
  onSaveDraft,
  onUpload,
  onExport,
  permissions,
}: Props) => {
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "Start Workflow",
    confirmVariant: "primary",
  });

  const onStartWorkflow = async () => {
    const ok = await confirm();

    if (ok) {
      await onWorkflow();
    }
  };

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const scrollParent = getScrollParent(toolbarRef.current);
    if (!scrollParent) return;

    const onScroll = () => {
      setIsScrolled(scrollParent.scrollTop > 0);
    };

    onScroll();
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollParent.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "flex items-center gap-1.5 w-full min-w-105 max-w-full mx-auto py-2 px-3 sticky z-100 bg-background",
        isScrolled && "border-b border-border",
      )}
      style={{ top: `calc(var(${EMPLOYEE_INFO_HEIGHT_VAR}, 0px) - 0.75px)` }}
    >
      <div className="grow h-full">
        <div className="flex flex-row justify-between items-center h-full gap-0.5">
          <div className="inline-flex items-center gap-1 relative shrink-0 h-7">
            <ConfirmationDialog />
            <StatusBadge {...status} />
          </div>
          <div className="relative shrink-0 rounded overflow-hidden h-7 ml-1 flex">
            <div className="inline-flex gap-1">
              {permissions.write && (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onSaveDraft}
                    className="rounded gap-1.5"
                  >
                    <BsFloppy2Fill className="stroke-[0.25] size-4" />
                    Save Draft
                  </Button>
                  {permissions["start-workflow"] && (
                    <Button
                      size="sm"
                      type="button"
                      variant="primary"
                      className="rounded"
                      onClick={onStartWorkflow}
                    >
                      Start workflow
                    </Button>
                  )}
                </>
              )}
              {onExport && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onExport}
                  className="rounded gap-1.5 px-2"
                >
                  Export
                </Button>
              )}
              {/* <div data-show={!!onCreate || !!onUpload} className="flex-row data-[show=true]:flex hidden">
                {!!onCreate && !!onUpload ? (
                  <>
                    <Separator orientation="vertical" className="mx-1" />
                    <button 
                      type="button" 
                      onClick={onCreate} 
                      className="transition flex items-center justify-center whitespace-nowrap rounded-l px-2 font-medium bg-marine text-white text-sm hover:bg-marine/80"
                    >
                      New
                    </button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="transition flex items-center justify-center whitespace-nowrap rounded-r bg-marine shadow-[inset_1px_0_0_rgba(55,53,47,0.16)] text-white text-sm w-6 hover:bg-marine/80 focus-visible:outline-none">
                          <ChevronDownIcon className="size-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-[260px] p-1">
                        <h3 className="text-sm data-inset:pl-8! select-none flex items-center min-h-7 ps-1 font-medium text-primary">Import</h3>
                        <Button 
                          type="button"
                          variant="ghost" 
                          className="h-auto px-2 w-full" 
                          onClick={onUpload}
                        >
                          <div className="flex items-center justify-center min-w-5 min-h-5 self-start">
                            <BsFiletypeCsv className="stroke-[0.15]! size-5 mt-0.5" />
                          </div>
                          <div className="grow shrink basis-auto">
                            <h5 className="whitespace-nowrap overflow-hidden text-ellipsis font-medium text-start">CSV</h5>
                            <p className="text-xs text-secondary wrap-break-words text-start">Upload and process a CSV file</p>
                          </div>
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </>
                ) : (
                  <Button 
                    size="sm"
                    type="button" 
                    className="rounded gap-1.5"
                    variant="primary"
                    onClick={onUpload}
                  >
                    <BsUpload className="stroke-[0.25] size-4" />
                    Import
                  </Button>
                )}
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
