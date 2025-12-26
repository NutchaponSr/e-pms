import { Employee } from "@/generated/prisma/client";

import { UserAvatar } from "./user-avatar";
import { CardProfile } from "./card-profile";

interface Props {
  employee?: Employee;
}

export const UserProfile = ({ employee } :Props) => {
  return (
    <CardProfile employee={employee}>
      <div className="select-none relative text-sm overflow-hidden items-center flex min-h-8">
        <div className="shrink-0 grow-0 me-1.5 mt-0">
          <UserAvatar
            name={employee?.name || ""}
            className={{
              container: "shrink-0 grow-0 rounded-full size-6 flex items-center justify-center",
              fallback: "bg-marine! rounded text-white! text-sm"
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