import { Employee } from "@/generated/prisma/client";

import { UserAvatar } from "./user-avatar";
import { CardProfile } from "./card-profile";

interface Props {
  employee?: Employee;
}

export const UserProfile = ({ employee } :Props) => {
  return (
    <CardProfile employee={employee}>
      <div className="select-none relative flex min-h-6 overflow-hidden text-sm items-start">
        <div className="shrink-0 grow-0 me-1.5">
          <UserAvatar
            name={employee?.name || ""}
            className={{
              container: "shrink-0 grow-0 rounded-full size-5 flex items-center justify-center",
              fallback: "bg-marine! rounded text-white! text-xs"
            }}
          />
        </div>
        <div className="text-primary leading-normal wrap-break-word whitespace-nowrap text-ellipsis overflow-hidden">
          {employee?.name || ""}
        </div>
      </div>
    </CardProfile>
  );
}