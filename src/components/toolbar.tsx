import { ChevronDownIcon } from "lucide-react";
import { BsFiletypeCsv, BsFloppy2Fill, BsSave } from "react-icons/bs";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  onCreate: () => void;
}

export const Toolbar = ({ onCreate }: Props) => {
  return (
    <div className={"flex items-center gap-1.5 w-full min-w-[420px] max-w-full mx-auto py-4 px-3 sticky top-10 z-100 bg-background"}>
      <div className="grow h-full">
        <div className="flex flex-row justify-end items-center h-full gap-0.5">
          <div 
            data-show={true}
            className="relative shrink-0 rounded overflow-hidden h-7 ml-1 data-[show=true]:inline-flex hidden"
          >
            <button 
              type="button" 
              onClick={onCreate} 
              className="transition flex items-center justify-center whitespace-nowrap rounded-l px-2 font-medium bg-marine text-white text-sm hover:bg-marine/80"
            >
              New
            </button>
            <button 
              type="button" 
              disabled={false}
              onClick={() => {}}
              className="transition flex items-center justify-center whitespace-nowrap px-2 font-medium bg-marine text-white text-sm hover:bg-marine/80 shadow-[inset_1px_0_0_rgba(55,53,47,0.16)] gap-1.5 disabled:opacity-60"
            >
              {false ? (
                <>
                  <Spinner className="text-white size-4" />
                  Saving
                </>
              ) : (
                <>
                  <BsFloppy2Fill className="stroke-[0.25] size-4" />
                  Save Draft
                </>
              )}
            </button>
            <button 
              type="submit" 
              disabled={false}
              className="transition flex items-center justify-center whitespace-nowrap px-2 font-medium bg-marine text-white text-sm hover:bg-marine/80 shadow-[inset_1px_0_0_rgba(55,53,47,0.16)] gap-1.5 disabled:opacity-60"
            >
              {false ? (
                <>
                  <Spinner className="text-white size-4" />
                  Submitting
                </>
              ) : (
                <>
                  <BsSave className="stroke-[0.25] size-4" />
                  Final Confirmation
                </>
              )}
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
  );
}