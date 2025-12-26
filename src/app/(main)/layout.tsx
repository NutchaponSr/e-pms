import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-provider";

import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

const Layout = (props: LayoutProps<"/">) => {
  return (
    <div className="h-full">
      <SidebarProvider>
        <div className="w-screen h-full relative flex bg-background">
          <AuthGuard>
            <Sidebar />
            {props.children}
          </AuthGuard>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default Layout;