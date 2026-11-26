"use client";

import {
  CalendarRangeIcon,
  DownloadIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { ChainSection } from "../components/chain-section";
import { EmployeesSection } from "../components/employees-section";
import { OverviewSection } from "../components/overview-section";
import { ReportsSection } from "../components/reports-section";
import { TasksSection } from "../components/tasks-section";
import { WindowsSection } from "../components/windows-section";

const SECTIONS = [
  {
    value: "overview",
    label: "ภาพรวม",
    description: "ดูความคืบหน้า งานที่ยังไม่เสร็จ และคะแนนที่อนุมัติแล้วของทั้งองค์กร",
    icon: LayoutDashboardIcon,
  },
  {
    value: "employees",
    label: "พนักงาน",
    description: "ค้นหาพนักงาน เพิ่มรายชื่อใหม่ และเปิดหรือปิดบัญชีเข้าใช้งาน",
    icon: UsersIcon,
  },
  {
    value: "chain",
    label: "สายอนุมัติ",
    description: "กำหนดผู้ประเมินคนที่ 1 และคนที่ 2 ของพนักงานแต่ละคน",
    icon: GitBranchIcon,
  },
  {
    value: "tasks",
    label: "งาน",
    description: "ติดตามงานประเมินของแต่ละช่วง และปรับสถานะเมื่อจำเป็น",
    icon: ListChecksIcon,
  },
  {
    value: "windows",
    label: "ช่วงเปิด-ปิด",
    description: "กำหนดวันเปิดและวันปิดของแต่ละรอบ วันที่ไม่ได้ตั้งจะเปิดตลอด",
    icon: CalendarRangeIcon,
  },
  {
    value: "reports",
    label: "ส่งออก",
    description:
      "กรองพนักงานทั้งองค์กร แล้วดาวน์โหลด Summary ของ KPI Bonus และ Merit เป็นไฟล์ Excel แยกกัน",
    icon: DownloadIcon,
  },
] as const;

const TAB_VALUES = SECTIONS.map((section) => section.value);

type TabValue = (typeof SECTIONS)[number]["value"];

const tabParser = parseAsStringLiteral(TAB_VALUES).withDefault("overview");

export const AdminView = () => {
  const [tab, setTab] = useQueryState("tab", tabParser);
  const active =
    SECTIONS.find((section) => section.value === tab) ?? SECTIONS[0];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#f7f6f3] text-primary dark:bg-background">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col px-4 pt-8 pb-24 sm:px-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-[0_0_0_1px_rgba(15,15,15,0.08)] dark:bg-white/6 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
              <ShieldIcon className="size-5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
                การดูแลระบบ
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-secondary">
                {active.description}
              </p>
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(value) => {
              void setTab(value as TabValue);
            }}
            className="mt-6 gap-0"
          >
            <div className="sticky top-0 z-20 -mx-4 bg-[#f7f6f3]/95 px-4 backdrop-blur-sm sm:-mx-8 sm:px-8 dark:bg-background/95">
              <TabsList
                aria-label="ส่วนของหน้าดูแลระบบ"
                className="h-auto w-full justify-start gap-1 overflow-x-auto py-2"
              >
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <TabsTrigger
                      key={section.value}
                      value={section.value}
                      className={cn(
                        "h-8 shrink-0 gap-1.5 rounded-md px-2.5 text-sm font-medium after:hidden",
                        "text-secondary hover:bg-black/5 hover:text-primary",
                        "data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-[0_0_0_1px_rgba(15,15,15,0.08),0_1px_2px_rgba(15,15,15,0.04)]",
                        "dark:hover:bg-white/8 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:shadow-none",
                      )}
                    >
                      <Icon className="size-3.5" />
                      {section.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-5 min-w-0 outline-none">
              <OverviewSection />
            </TabsContent>
            <TabsContent
              value="employees"
              className="mt-5 min-w-0 outline-none"
            >
              <EmployeesSection />
            </TabsContent>
            <TabsContent value="chain" className="mt-5 min-w-0 outline-none">
              <ChainSection />
            </TabsContent>
            <TabsContent value="tasks" className="mt-5 min-w-0 outline-none">
              <TasksSection />
            </TabsContent>
            <TabsContent value="windows" className="mt-5 min-w-0 outline-none">
              <WindowsSection />
            </TabsContent>
            <TabsContent value="reports" className="mt-5 min-w-0 outline-none">
              <ReportsSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
