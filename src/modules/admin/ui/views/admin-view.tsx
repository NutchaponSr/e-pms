"use client";

import { ShieldIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EmployeesSection } from "../components/employees-section";
import { ChainSection } from "../components/chain-section";
import { TasksSection } from "../components/tasks-section";
import { WindowsSection } from "../components/windows-section";
import { ReportsSection } from "../components/reports-section";

export const AdminView = () => {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <ShieldIcon className="size-5 text-secondary" />
          <h1 className="text-xl font-semibold text-primary">Admin Panel</h1>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="chain">Approval Chain</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="windows">Open/Close Dates</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeesSection />
          </TabsContent>
          <TabsContent value="chain">
            <ChainSection />
          </TabsContent>
          <TabsContent value="tasks">
            <TasksSection />
          </TabsContent>
          <TabsContent value="windows">
            <WindowsSection />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
