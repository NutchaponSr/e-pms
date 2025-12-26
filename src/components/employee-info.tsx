"use client";

import { BsPersonFill } from "react-icons/bs";
import { FaWeightHanging } from "react-icons/fa";

import { Employee } from "@/generated/prisma/client";
import { Separator } from "@/components/ui/separator";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { UserProfile } from "@/modules/auth/ui/components/user-profile";

interface Props {
  owner?: Employee;
  checker?: Employee | null;
  approver?: Employee;
  children: React.ReactNode;
}

export const EmployeeInfo = ({ owner, checker, approver, children }: Props) => {

  return (
    <section className="grid xl:grid-cols-6 grid-cols-4 z-2 relative bg-background border-y border-border">
      <div className="col-span-5 relative py-2 flex flex-col">
        <div className="h-full flex justify-stretch gap-3 px-3">
          <div className="flex flex-row gap-2.5 items-center">
            <UserAvatar
              name={owner?.name || ""}
              className={{
                container:
                  "shrink-0 grow-0 rounded size-7 flex items-center justify-center dark:shadow-[0_0_0_1.25px_#383836,0px_14px_28px_-6px_#0003,0px_2px_4px_-1px_#0000001f]",
                fallback: "bg-marine! rounded text-white! text-lg",
              }}
            />
            <div className="flex flex-col whitespace-nowrap overflow-hidden text-ellipsis">
              <div className="text-sm leading-5 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                {owner?.name}
              </div>
              <div className="text-xs leading-4 whitespace-nowrap overflow-hidden text-ellipsis text-secondary">
                {owner?.email || "-"}
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-full w-[1.25px]! rounded-md" />

          <div className="flex flex-col whitespace-nowrap overflow-hidden text-ellipsis px-2">
            <div className="text-xs leading-5 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
              Position
            </div>
            <div className="text-xs leading-4 whitespace-nowrap overflow-hidden text-ellipsis text-secondary">
              {owner?.position || "-"}
            </div>
          </div>
          <div className="flex flex-col whitespace-nowrap overflow-hidden text-ellipsis px-2">
            <div className="text-xs leading-5 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
              Company/Division
            </div>
            <div className="text-xs leading-4 whitespace-nowrap overflow-hidden text-ellipsis text-secondary">
              {owner?.division || "-"}
            </div>
          </div>
          <div className="flex flex-col whitespace-nowrap overflow-hidden text-ellipsis px-2">
            <div className="text-xs leading-5 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
              Department/Section
            </div>
            <div className="text-xs leading-4 whitespace-nowrap overflow-hidden text-ellipsis text-secondary">
              {owner?.department || "-"}
            </div>
          </div>
        </div>

        <div className="px-3 relative">
          <div className="h-full flex items-center gap-3 mt-3 border-t-2 border-dotted border-border">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,max-content))] gap-x-4 my-2 max-w-full">
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-row">
                  <div className="flex items-center leading-4.5 min-w-0 text-xs text-secondary">
                    <BsPersonFill className="size-3.5 me-1" />
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      Owner
                    </div>
                  </div>
                </div>
                <UserProfile employee={owner}/>
              </div>
              {checker && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-row">
                    <div className="flex items-center leading-4.5 min-w-0 text-xs text-secondary">
                      <BsPersonFill className="size-3.5 me-1" />
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                        Checker
                      </div>
                    </div>
                  </div>
                  <UserProfile employee={checker}/>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-row">
                  <div className="flex items-center leading-4.5 min-w-0 text-xs text-secondary">
                    <BsPersonFill className="size-3.5 me-1" />
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      Approver
                    </div>
                  </div>
                </div>
                <UserProfile employee={approver}/>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="xl:col-span-1 col-span-4 xl:border-l-[1.5px] border-t border-border">
        <div className="flex flex-col p-3 h-full grow-0 justify-between">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="p-1 rounded-sm bg-marine">
              <FaWeightHanging className="size-3.5 text-white" />
            </div>
            <p className="text-sm font-medium max-w-full whitespace-nowrap overflow-hidden text-ellipsis">Weight</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );  
};
