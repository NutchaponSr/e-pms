import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { useState } from "react";
import { BsArrowUpCircleFill } from "react-icons/bs";

interface Props {
  onCreate: (content: string) => void;
}

export const CommentInput = ({ onCreate }: Props) => {
  const { data: session } = authClient.useSession();

  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!message.trim()) return;

    onCreate(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div className="flex items-center grow">
      <div className="shrink-0 grow-0 me-2 self-start my-1">
        <UserAvatar
          name={session?.user?.name || ""}
          className={{
            container:
              "shrink-0 grow-0 rounded-full size-6 flex items-center justify-center",
            fallback: "bg-marine! rounded text-white text-sm",
          }}
        />
      </div>
      <div className="flex flex-wrap self-center relative justify-end text-sm cursor-text bg-transparent items-center gap-y-1 gap-x-1.5 p-1 w-full">
        <div className="grow flex min-h-6 pt-0.5">
          <textarea
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="max-w-full w-full whitespace-pre-wrap wrap-break-word text-sm p-0.5 -m-0.5 leading-5 overflow-hidden focus-visible:outline-none resize-none h-full field-sizing-content break-all"
          />
        </div>
        <div className="flex flex-col-reverse items-end w-min">
          <div className="flex flex-row items-center gap-1.5">
            <button
              type="button"
              onClick={handleSubmit}
              className={cn(
                "select-none transition-all inline-flex opacity-40 items-center justify-center shrink-0 rounded size-6 p-0",
                !!message && "opacity-100 hover:bg-[#298bfd10]",
                false && "opacity-40",
              )}
            >
              <BsArrowUpCircleFill
                className={cn(
                  "size-5",
                  !!message ? "text-marine" : "text-muted",
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}