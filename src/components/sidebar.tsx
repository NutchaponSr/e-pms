import { UserButton } from "@/modules/auth/ui/components/user-button";

export const Sidebar = () => {
  return (
    <aside className="w-60 h-full bg-sidebar shadow-[inset_-1.25px_0_0_0_#2a2a2a]">
      <div className="flex flex-col h-full relative w-60">
        <div className="flex flex-col h-full max-h-full justify-between overflow-hidden relative">
          <div className="block shrink-0 grow-0">
            <UserButton />
          </div>
        </div>
      </div>
    </aside>
  );
}