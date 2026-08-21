"use client";

import { 
  CheckIcon, 
  ChevronDownIcon, 
  FileIcon, 
  Loader2Icon, 
  SearchIcon,
  XIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";

import { Competency } from "@/generated/prisma/client";
import { CompetencyType } from "@/generated/prisma/enums";

import { useDebounce } from "@/hooks/use-debounce";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHidden,
  DialogFooter,
  DialogClose,
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
  perform,
  onSelect, 
  selectedCompetencyId, 
  value, 
  fallbackCompetency 
}: Props) => {
  const trpc = useTRPC();

  const selectedId = selectedCompetencyId || value || fallbackCompetency?.id || "";

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [pendingCompetency, setPendingCompetency] = useState<Competency | null>(null);
  const [confirmedCompetency, setConfirmedCompetency] = useState<Competency | null>(
    fallbackCompetency || null
  );

  const debouncedSearchTerm = useDebounce(search, 500);
  const enabled = debouncedSearchTerm.length > 0;

  const {
    data: competencies,
    isLoading,
  } = useQuery({
    ...trpc.competency.getMany.queryOptions({
      types: types.types,
      search: debouncedSearchTerm,
    }),
    enabled,
  });

  // Sync จาก server/form เฉพาะเมื่อค่าตรงกับ fallback (เช่นหลัง save draft + refetch)
  // ไม่ดึงจาก search results เพราะพอปิด dialog แล้ว search ถูกเคลียร์ จะได้ fallback เก่ากลับมาทับ
  useEffect(() => {
    if (!fallbackCompetency) return;
    if (fallbackCompetency.id !== selectedId) return;
    setConfirmedCompetency(fallbackCompetency);
  }, [fallbackCompetency, selectedId]);

  const resolvedCompetency =
    (confirmedCompetency?.id === selectedId ? confirmedCompetency : null) ||
    (fallbackCompetency?.id === selectedId ? fallbackCompetency : null) ||
    confirmedCompetency ||
    fallbackCompetency ||
    null;

  const effectiveSelectedCompetency =
    pendingCompetency || resolvedCompetency;

  const displayText = resolvedCompetency?.name || types.label;
  const isButtonSelected = !!resolvedCompetency;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setPendingCompetency(null);
          setSearch("");
        }
      }}
    >
      <DialogTrigger disabled={!perform} asChild>
        <Button 
          type="button" 
          size="lg" 
          className={cn(
            "w-full min-w-0 overflow-hidden justify-between text-xl text-tertiary transition-all px-2",
            isButtonSelected && "font-medium text-primary",
            !perform && "text-primary opacity-100!"
          )} 
          variant={!perform ? "ghost" :"outline"}
        >
          <span className="truncate min-w-0 flex-1 text-left">{displayText}</span>
          {perform && (
            <ChevronDownIcon 
              className={cn(
                "ml-2 size-6 shrink-0 transition-transform duration-200 stroke-[1.5]",
                open && "rotate-180"
              )} 
            />
          )}
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
                      {competencies.map((competency) => {
                        const isItemSelected = competency.id === effectiveSelectedCompetency?.id;
                        return (
                          <div 
                            key={competency.id} 
                            className={cn(
                              "select-none transition cursor-pointer flex w-full rounded-sm hover:bg-[#2a1c0012] overflow-hidden",
                              isItemSelected && "bg-[#2a1c0012]"
                            )}
                            onClick={() => setPendingCompetency(competency)}
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
          <DialogFooter className="flex items-center justify-end gap-2 border-t px-4 py-3">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                type="button"
                size="sm"
                disabled={!effectiveSelectedCompetency}
                onClick={() => {
                  if (!effectiveSelectedCompetency) return;
                  setConfirmedCompetency(effectiveSelectedCompetency);
                  onSelect(effectiveSelectedCompetency);
                }}
              >
                Confirm
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
