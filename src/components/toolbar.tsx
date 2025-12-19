import { ChevronDownIcon } from "lucide-react";
import { BsFiletypeCsv, BsFloppy2Fill, BsSave } from "react-icons/bs";

import { useConfirm } from "@/hooks/use-confirm";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { StatusBadge } from "@/components/status-badge";

import { StatusVariant } from "@/modules/tasks/types";

interface Props {
  confirmTitle: string;
  status: {
    label: string;
    variant: StatusVariant;
  };
  onCreate: () => void;
  onWorkflow: () => void;
}

export const Toolbar = ({ 
  status,
  confirmTitle, 
  onCreate, 
  onWorkflow 
}: Props) => {
  const [ConfirmationDialog, confirm] = useConfirm({
    title: confirmTitle,
    confirmVariant: "primary"
  });

  const onStartWorkflow = async () => {
    const ok = await confirm();

    if (ok) {
      onWorkflow();
    }
  }

  return (
    <div className="flex items-center gap-1.5 w-full min-w-[420px] max-w-full mx-auto py-4 px-3 sticky top-0 z-100 bg-background">
      <div className="grow h-full">
        <div className="flex flex-row justify-between items-center h-full gap-0.5">
          <div className="inline-flex items-center gap-1 relative shrink-0 h-7">
            <Button
              size="sm"
              type="button"
              className="rounded"
              onClick={onStartWorkflow}
            >
              Start workflow
            </Button>
            <ConfirmationDialog />
            <Separator orientation="vertical" className="mx-1" />
            <StatusBadge {...status} />
          </div>
          <div 
            data-show={true}
            className="relative shrink-0 rounded overflow-hidden h-7 ml-1 data-[show=true]:inline-flex hidden gap-1"
          >
            <Button 
              size="sm"
              type="button" 
              className="rounded gap-1.5"
              variant="primaryGhost"
            >
              <BsSave className="stroke-[0.25] size-4" />
              Final Confirmation
            </Button>
            <button 
              type="button" 
              className="transition flex items-center justify-center whitespace-nowrap rounded px-2 font-medium bg-marine text-white text-sm hover:bg-marine/80 gap-1.5"
            >
              <BsFloppy2Fill className="stroke-[0.25] size-4" />
              Save Draft
            </button>
            <Separator orientation="vertical" className="mx-1" />
            <div className="flex flex-row">
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
                    onClick={() => {}}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}