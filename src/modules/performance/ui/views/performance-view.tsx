"use client";

import { parseAsInteger } from "nuqs";
import { EyeIcon, TargetIcon } from "lucide-react";

import { useSearchParams } from "@/hooks/use-search-params";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { Event } from "@/modules/performance/ui/components/event";
import { EventSection } from "@/modules/performance/ui/components/event-section";

export const PerformanceView = () => {
  const [state, setState] = useSearchParams({
    year: parseAsInteger.withDefault(new Date().getFullYear()),
  })

  const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - index);

  return (
    <div className="z-1 w-full h-full cursor-default bg-background overflow-x-hidden overflow-y-auto">
      <Tabs defaultValue={state.year?.toString()} onValueChange={(value) => setState({ year: parseInt(value) })} className="grid grid-cols-[minmax(0,56px)_minmax(auto,1fr)_minmax(0,56px)] pb-40 relative gap-10">
        <div className="col-span-full relative after:absolute after:-bottom-px after:left-0 after:z-50 after:w-full after:h-[1.25px] after:bg-border after:block">
          <div className="flex items-center px-3">
            <TabsList>
              {years.map((year) => (
                <TabsTrigger key={year} value={year.toString()}>
                  {year}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="w-[1.25px] h-4 bg-border self-center ms-1.5 me-1 bg-clip-content box-border" />
            <Button variant="ghost" size="xs" className="px-1 py-0 text-xs text-secondary">
              <EyeIcon className="size-4" />
              View all
            </Button>
          </div>
        </div>
        <div className="col-start-2 select-none">
          <div className="grid grid-cols-2">
            <EventSection icon={TargetIcon} title="KPI Bonus">
              <Event 
                dueDate="Jan - Mar" 
                title="KPI Definition"
                description="Define measurable goals aligned with team and company priorities"
              />
              <Event 
                dueDate="Mar - Dec" 
                title="Evaluation"
                description="Assessment of progress towards defined KPIs"
              />
            </EventSection>
          </div>
        </div>
      </Tabs>
    </div>
  )
}