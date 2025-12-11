import { Breadcrumb } from "@/components/breadcrumb";

export const Header = () => {
  return (
    <header className="bg-transparent max-w-[100vw] select-none relative">
      <div className="w-full max-w-[100vw] h-11 relative start-0">
        <div className="contents">
          <div className="flex justify-between items-center h-11 overflow-hidden px-3">
            <Breadcrumb />
          </div>
        </div>
      </div>
    </header>
  );
}