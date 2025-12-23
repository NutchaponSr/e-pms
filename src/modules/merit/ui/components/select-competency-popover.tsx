"use client";

import { Command } from "cmdk";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, ChevronDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { useTRPC } from "@/trpc/client";

import { Competency } from "@/generated/prisma/client";
import { CompetencyType } from "@/generated/prisma/enums";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  perform: boolean;
  types: { types: CompetencyType[], label: string };
  onSelect: (competency: Competency) => void;
  selectedCompetencyId?: string;
  value: string;
  fallbackCompetency?: Competency | null;
}

export const SelectCompetencyPopover = ({ value, types, perform, onSelect, selectedCompetencyId, fallbackCompetency }: Props) => {
  const trpc = useTRPC();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: competencies, isLoading } = useQuery(trpc.competency.getMany.queryOptions({ types: types.types }));

  const selectedCompetency = useMemo(() => {
    const idToFind = selectedCompetencyId || value || fallbackCompetency?.id;
    if (idToFind && competencies) {
      const found = competencies.find(c => c.id === idToFind);
      if (found) return found;
    }
    return fallbackCompetency || null;
  }, [selectedCompetencyId, value, competencies, fallbackCompetency]);

  const handleSelect = (competency: Competency) => {
    onSelect(competency);
    setIsOpen(false);
    setSearchQuery("");
  };

  const displayText = selectedCompetency?.name || fallbackCompetency?.name || types.label;
  const isSelected = !!selectedCompetency;

  return (
    <Popover modal open={isOpen && perform} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          size="lg" 
          data-selected={isSelected}
          className={cn(
            "w-full justify-between text-xl text-tertiary transition-all duration-200",
            "hover:bg-accent/10 hover:text-tertiary data-[selected=true]:text-primary",
            isSelected && "font-medium text-foreground"
          )} 
          variant="ghost"
        >
          <span className="truncate flex-1 text-left">{displayText}</span>
          <ChevronDown 
            className={cn(
              "ml-2 size-6 shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        side="bottom" 
        className="p-0 bg-[#252525] max-w-[calc(100vw-24px)] overflow-hidden w-[414px] border-border/50 shadow-xl" 
        sideOffset={4}
      >
        <Command 
          className="min-w-[180px] max-w-[calc(100vw-24px)] h-[50vh] max-h-[70vh]"
          shouldFilter={true}
        >
          <div className="shrink-0 border-b border-border/30">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="flex items-center w-full text-sm leading-5 relative rounded-sm dark:shadow-[0_0_0_1.25px_#ffffff13] dark:bg-[#ffffff0e] cursor-text px-3 h-7 py-0.5 transition-all duration-200 focus-within:shadow-[0_0_0_1.5px_#ffffff20]">
                <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Command.Input 
                  placeholder="ค้นหา Competency..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="w-full block resize-none p-0 pl-7 bg-transparent focus-visible:outline-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>  
          <Command.List className="max-h-[320px] min-h-0 grow z-1 overflow-x-hidden overflow-y-auto mx-0 mb-0 p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p>ไม่พบผลลัพธ์</p>
                    <p className="text-xs text-muted-foreground/70">ลองค้นหาด้วยคำอื่น</p>
                  </div>
                </Command.Empty>
                <Command.Group>
                  {competencies?.map((c) => {
                    const currentSelectedId = selectedCompetencyId || value;
                    const isItemSelected = currentSelectedId === c.id;
                    return (
                      <Command.Item
                        key={c.id}
                        value={`${c.name} ${c.definition || ""}`}
                        onSelect={() => handleSelect(c)}
                        className={cn(
                          "flex rounded w-full cursor-pointer transition data-[selected=true]:bg-primary/6 mt-px",
                          isItemSelected && "bg-primary/6",
                        )}
                      >
                        <div className="flex items-center gap-2 w-full select-none min-h-7 text-sm px-2 py-1">
                          <div className="grow shrink basis-auto min-w-0">
                            <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                              <div className="flex flex-row items-center gap-2">
                                <div className="whitespace-nowrap overflow-hidden text-ellipsis text-primary font-medium">
                                  {c.name}
                                </div>
                                {isItemSelected && (
                                  <Check className="h-4 w-4 shrink-0 text-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </>
            )}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
};