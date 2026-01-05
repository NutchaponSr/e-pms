"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, FileIcon, Loader2Icon, SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Competency } from "@/generated/prisma/client";
import { CompetencyType } from "@/generated/prisma/enums";

import { useDebounce } from "@/hooks/use-debounce";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHidden
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

interface Props {
  perform: boolean;
  types: { types: CompetencyType[], label: string };
  onSelect: (competency: Competency) => void;
  selectedCompetencyId?: string;
  value: string;
  fallbackCompetency?: Competency | null;
}

export const SelectCompetencyPopover = ({ 
  types, 
  onSelect, 
  selectedCompetencyId, 
  value, 
  fallbackCompetency 
}: Props) => {
  const trpc = useTRPC();

  const [search, setSearch] = useState("");

  const debouncedSearchTerm = useDebounce(search, 500);

  const query = trpc.competency.getMany.queryOptions({
    types: types.types,
    search: debouncedSearchTerm
  });

  const enabled = debouncedSearchTerm.length > 0;

  const {
    data: competencies,
    isLoading,
  } = useQuery({
    ...query,
    enabled,
  });

  const selectedCompetency = useMemo(() => {
    const idToFind = selectedCompetencyId || value || fallbackCompetency?.id;
    if (idToFind && competencies) {
      const found = competencies.find(c => c.id === idToFind);
      if (found) return found;
    }
    return fallbackCompetency || null;
  }, [selectedCompetencyId, value, competencies, fallbackCompetency]);

  const displayText = selectedCompetency?.name || fallbackCompetency?.name || types.label;
  const isButtonSelected = !!selectedCompetency;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          type="button" 
          size="lg" 
          data-selected={isButtonSelected}
          className={cn(
            "w-full justify-between text-xl text-tertiary transition-all duration-200",
            "hover:bg-accent/10 hover:text-tertiary data-[selected=true]:text-primary",
            isButtonSelected && "font-medium text-foreground"
          )} 
          variant="ghost"
        >
          <span className="truncate flex-1 text-left">{displayText}</span>
          <ChevronDownIcon 
            className={cn(
              "ml-2 size-6 shrink-0 transition-transform duration-200",
              isButtonSelected && "rotate-180"
            )} 
          />
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-w-[755px]! w-full top-1/4! p-0 translate-y-[-25%]">
        <DialogHidden />
        
        <div className="flex flex-col gap-px max-w-full min-w-[180px]">
          <div className="flex items-center w-full text-lg h-12 ps-3 pe-4 grow-0 shrink-0">
            <div className="me-1.5 size-6 flex justify-center items-center">
              {isLoading ? (
                <Loader2Icon className="size-5 text-tertiary animate-spin" />
              ) : (
                <SearchIcon className="size-5 text-tertiary" />
              )}
            </div>
            <div className="relative w-full">
              <input 
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Competency..."
                className="w-full block resize-none whitespace-nowrap text-ellipsis overflow-hidden bg-transparent focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {enabled && (
            <div className="flex flex-row overflow-hidden max-w-full">
              <div className="flex grow shrink basis-0 overflow-x-hidden overflow-y-auto h-[480px]">
                <div className="pt-2 grow basis-0 shrink flex flex-col overflow-auto h-full px-1 pb-1">
                  {competencies && competencies.length === 0 && (
                    <div className="flex items-center gap-2 leading-[120%] select-none text-sm px-2 py-8 my-auto">
                      <div className="min-w-0 grow shrink basis-auto text-center">
                        <div className="text-secondary font-medium leading-5 text-base">No results.</div>
                      </div>
                    </div>
                  )}

                  {competencies && competencies.length > 0 && (
                    <div className="flex flex-col gap-px">
                      {competencies?.map((competency) => {
                        const isItemSelected = competency.id === selectedCompetency?.id;
                        return (
                          <div 
                            key={competency.id} 
                            className={cn(
                              "select-none transition cursor-pointer flex w-full rounded-sm hover:bg-[#2a1c0012] overflow-hidden",
                              isItemSelected && "bg-[#2a1c0012]"
                            )}
                            onClick={() => onSelect(competency)}
                          >
                            <div className="flex items-center gap-2 leading-[120%] w-full select-none min-h-9 text-sm p-2 transition-none">
                              <div className="flex items-center justify-center size-5 mt-px self-start">
                                <FileIcon className="size-4.5 text-tertiary" />
                              </div>
                              <div className="mx-0 min-w-0 grow shrink basis-auto items-center w-full">
                                <div className="flex justify-between font-medium leading-5 text-secondary">
                                  <div className="flex gap-1.5 w-0 grow">
                                    <div className="whitespace-nowrap overflow-hidden text-ellipsis font-medium leading-5 text-primary">
                                      {competency.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="whitespace-nowrap overflow-hidden text-ellipsis text-secondary mt-px text-xs">
                                  <div className="flex text-xs text-tertiary overflow-hidden">
                                    <div className="whitespace-nowrap wrap-break-word overflow-hidden text-ellipsis text-tertiary text-xs">
                                      {competency.definition}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div data-selected={isItemSelected} className={cn(
                                "flex flex-row items-center justify-center size-5 mt-px self-start",
                                !isItemSelected && "hidden"
                              )}>
                                <CheckIcon className="size-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}