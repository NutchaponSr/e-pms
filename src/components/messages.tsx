import { BsTrash3 } from "react-icons/bs";
import { useParams } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";

import { Period } from "@/generated/prisma/enums";

import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { useDeleteComment } from "@/modules/comments/api/use-delete-comment";

import { Action } from "@/modules/tasks/permissions";
import { CommentWithEmployee } from "@/modules/comments/types";

interface Props {
  isLast?: boolean;
  comment: CommentWithEmployee;
  permissions: Record<Action, boolean>;
}

const PERIODS: Record<string, Period> = {
  definition: Period.IN_DRAFT,
  evaluation: Period.EVALUATION,
};

export const Message = ({ isLast, comment, permissions }: Props) => {
  const params = useParams<{ period: Period, id: string }>();

  const deleteComment = useDeleteComment(params.id, PERIODS[params.period]);

  const createdAt = comment.createdAt instanceof Date 
    ? comment.createdAt 
    : new Date(comment.createdAt);

  return (
    <div className="py-2">
      <div className="relative text-sm group/message">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center select-none text-sm gap-1.5">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <UserAvatar
                    name={comment.employee.name}
                    className={{
                      container: "size-6",
                      fallback: "text-sm font-normal"
                    }}
                  />
                  <div className="block">
                    <div className="font-semibold whitespace-normal text-primary">
                      {comment.employee.name}
                    </div>
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-100 min-w-70 p-3">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <UserAvatar
                      name={comment.employee.name}
                      className={{
                        container: "size-14",
                        fallback: "text-3xl font-bold"
                      }}
                    />
                    <div className="flex flex-col gap-[3px] overflow-hidden w-full">
                      <h3 className="text-sm leading-5 text-primary whitespace-nowrap overflow-hidden text-ellipsis font-semibold">
                        {comment.employee.name}
                      </h3>
                      <h5 className="text-xs leading-4 text-tertiary whitespace-break-spaces overflow-hidden text-ellipsis">
                        {comment.employee.department}
                      </h5>
                      <p className="text-xs leading-4 text-foreground whitespace-break-spaces overflow-hidden text-ellipsis">
                        {format(createdAt, "hh:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            
            <div className="text-xs text-tertiary whitespace-normal grow inline leading-4">
              {formatDistanceToNowStrict(createdAt)}
            </div>
          </div>
        </div>
        {!isLast && (
          <div className="absolute bg-ring rounded-xs w-[1.5px] h-[calc(100%-20px)] start-[11.25px] top-[30px]" />
        )}
        <div className="ps-8">
          <div className="flex flex-row justify-between">
            <div className="max-w-full w-full whitespace-break-spaces wrap-break-word text-primary leading-5 pt-1">
              {comment.content}
            </div>
          </div>
        </div>

        <div data-show={permissions.write} className="absolute end-0.5 -top-1 mt-0 transition group-hover/message:opacity-100 opacity-0 data-[show=false]:group-hover/message:opacity-0">
          <div className="flex items-center gap-0.5 bg-[#202020] dark:shadow-[0_0_0_1.25px_#383836,0px_4px_12px_-2px_#00000029] rounded-sm w-fit p-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="xsIcon" variant="ghost" type="button" className="text-tertiary hover:text-tertiary">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem variant="destructive" onClick={() => deleteComment({ id: comment.id })}>
                  <BsTrash3 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}