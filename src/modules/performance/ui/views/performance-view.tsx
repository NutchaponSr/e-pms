"use client";

import { EyeIcon } from "lucide-react";

import { useSearchParams } from "@/hooks/use-search-params";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { KpiInfo } from "@/modules/kpi/ui/components/kpi-info";
import { MeritInfo } from "@/modules/merit/ui/components/merit-info";
import { TaskSection } from "@/modules/tasks/ui/components/task-section";
import { FormTracker } from "@/modules/tasks/ui/components/form-tracker";

interface Props {
  year: number;
}

export const PerformanceView = ({ year }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const years = [nextYear, ...Array.from({ length: 5 }, (_, index) => currentYear - index)];

  return (
    <div className="z-1 w-full h-full cursor-default bg-background overflow-x-hidden overflow-y-auto">
      <Tabs defaultValue={searchParams.year?.toString()} onValueChange={(value) => setSearchParams({ year: parseInt(value) })} className="grid grid-cols-[minmax(0,56px)_minmax(auto,1fr)_minmax(0,56px)] pb-40 relative gap-10">
        <div className="sticky top-0 col-span-full z-100 bg-background after:absolute after:-bottom-[2.75px] after:left-0 after:z-50 after:w-full after:h-[1.25px] after:bg-border after:block">
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
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-4 items-stretch">
            <div className="h-full">
              <KpiInfo year={year} />
            </div>
            <div className="h-full">
              <MeritInfo year={year} /> 
            </div>
          </div>
        </div>
        <div className="col-start-2 select-none">
          <TaskSection />
        </div>
        <div className="col-start-2 select-none">
          <FormTracker year={year} />
        </div>
      </Tabs>
    </div>
  )
}