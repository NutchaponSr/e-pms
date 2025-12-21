import { SquareCheckIcon } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { TaskList } from "@/modules/tasks/ui/components/task-list";
import { TaskItem } from "@/modules/tasks/ui/components/task-item";

export const TaskSection = () => {
  const trpc = useTRPC();

  const { data: tasks } = useSuspenseQuery(trpc.task.todo.queryOptions());
  
  return (
    <section className="select-none">
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="contents">
          <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
            <div className="flex items-center justify-center size-4 me-2">
              <SquareCheckIcon className="size-3.5 shrink-0 block text-secondary" />
            </div>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">My tasks</span>
          </div>
        </div>
      </div>

      <TaskList hasSomeTask={tasks.length > 0}>
        {tasks.map((task) => (
          <TaskItem key={task.taskId} task={task} />
        ))}
      </TaskList>
    </section>
  );
}