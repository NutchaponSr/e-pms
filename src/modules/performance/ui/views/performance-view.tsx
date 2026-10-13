"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, EyeIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@/generated/prisma/enums";
import { useSearchParams } from "@/hooks/use-search-params";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { KpiInfo } from "@/modules/kpi/ui/components/kpi-info";
import { MeritInfo } from "@/modules/merit/ui/components/merit-info";
import { FormTracker } from "@/modules/tasks/ui/components/form-tracker";
import { TaskSection } from "@/modules/tasks/ui/components/task-section";
import { useTRPC } from "@/trpc/client";

interface Props {
  year: number;
}

function yearOptions(currentYear: number) {
  return [
    currentYear + 1,
    ...Array.from({ length: 5 }, (_, index) => currentYear - index),
  ];
}

export const PerformanceView = ({ year }: Props) => {
  const trpc = useTRPC();
  const [, setSearchParams] = useSearchParams();
  const years = yearOptions(new Date().getFullYear());
  const { data: evaluationYears } = useSuspenseQuery(
    trpc.task.getEvaluationYears.queryOptions(),
  );
  const otherYears = evaluationYears.filter((item) => !years.includes(item));
  const { data: session } = authClient.useSession();
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === UserRole.ADMIN;

  return (
    <div className="z-1 w-full h-full cursor-default bg-background overflow-y-auto">
      <Tabs
        value={year.toString()}
        onValueChange={(value) =>
          setSearchParams({ year: parseInt(value, 10) })
        }
        className="grid md:grid-cols-[minmax(0,56px)_minmax(0,1fr)_minmax(0,56px)] grid-cols-[minmax(0,16px)_minmax(0,1fr)_minmax(0,16px)] pb-40 relative lg:gap-10 gap-4"
      >
        <div className="sticky top-0 col-span-full z-100 bg-background after:absolute after:-bottom-[2.75px] after:left-0 after:z-50 after:w-full after:h-[1.25px] after:bg-border after:block">
          <div className="flex items-center px-3">
            <TabsList>
              {years.map((tabYear) => (
                <TabsTrigger key={tabYear} value={tabYear.toString()}>
                  {tabYear}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="w-[1.25px] h-4 bg-border self-center ms-1.5 me-1 bg-clip-content box-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  className="px-1 py-0 text-xs text-secondary"
                >
                  <EyeIcon className="size-4" />
                  View all
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {otherYears.length === 0 ? (
                  <DropdownMenuItem disabled>No other years</DropdownMenuItem>
                ) : (
                  otherYears.map((item) => (
                    <DropdownMenuItem
                      key={item}
                      onSelect={() => setSearchParams({ year: item })}
                    >
                      <CheckIcon
                        className={cn(
                          "size-3.5",
                          item === year ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {item}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {isAdmin && (
              <>
                <div className="w-[1.25px] h-4 bg-border self-center ms-1.5 me-1 bg-clip-content box-border" />
                <Button
                  asChild
                  variant="ghost"
                  size="xs"
                  className="px-1 py-0 text-xs text-secondary"
                >
                  <Link href="/performance/admin">
                    <ShieldIcon className="size-4" />
                    Admin
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="col-start-2 select-none min-w-0">
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-4 items-stretch">
            <div className="h-full">
              <KpiInfo year={year} />
            </div>
            <div className="h-full">
              <MeritInfo year={year} />
            </div>
          </div>
        </div>
        <div className="col-start-2 select-none min-w-0">
          <TaskSection />
        </div>
        <div className="col-start-2 select-none min-w-0">
          <FormTracker year={year} />
        </div>
      </Tabs>
    </div>
  );
};
