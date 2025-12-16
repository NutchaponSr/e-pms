import { Sidebar } from "@/components/sidebar";

import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

const Layout = (props: LayoutProps<"/">) => {
  return (
    <div className="h-full">
      <div className="w-screen h-full relative flex bg-background">
        <AuthGuard>
          <Sidebar />
          {props.children}
        </AuthGuard>
      </div>
    </div>
  );
}

export default Layout;