import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BsArrowUpCircleFill } from "react-icons/bs";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

import { Message } from "@/components/messages";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";

import { CommentWithEmployee } from "@/modules/comments/types";
import { CommentInput } from "./comment-input";


interface Props {
  comments: CommentWithEmployee[];
  onCreate: (content: string) => void;
}

export const CommentSection = ({ comments, onCreate }: Props) => {
  const { data: session } = authClient.useSession();

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateA.getTime() - dateB.getTime();
  });
  const latestComment = sortedComments[sortedComments.length - 1];

  if (comments.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="select-none flex items-center gap-2 p-1 rounded-sm hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <UserAvatar
                name={session?.user?.name || ""}
                className={{
                  container:
                    "shrink-0 grow-0 rounded-full size-6 flex items-center justify-center",
                  fallback: "bg-marine! rounded text-white text-sm",
                }}
              />
              <div className="flex items-baseline gap-2">
                <span className="text-sm">
                  {comments.length}
                  {comments.length > 1 ? " replies" : " reply"}
                </span>
                <span className="text-xs text-tertiary">
                  {formatDistanceToNow(
                    latestComment.createdAt instanceof Date 
                      ? latestComment.createdAt 
                      : new Date(latestComment.createdAt)
                  )}
                </span>
              </div>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col w-[420px] min-w-[180px] max-w-full max-h-[50vh] min-h-[100px]">
          <div className="grow min-h-0 overflow-x-hidden overflow-y-auto">
            <div className="relative">
              {sortedComments.map((comment, index) => {
                const isLast = index === comments.length - 1;

                return (
                  <Message 
                    key={index}
                    comment={comment}
                    isLast={isLast}
                  />
                );
              })}
            </div>
            <div className="relative p-0">
              <CommentInput onCreate={onCreate} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return <CommentInput onCreate={onCreate} />;
};
