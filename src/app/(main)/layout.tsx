import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-provider";

import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

const Layout = (props: LayoutProps<"/">) => {
  return (
    <AuthGuard>
      <div className="h-full">
        <SidebarProvider>
          <div className="w-screen h-full relative flex bg-background">
            <Sidebar />
            {props.children}
          </div>
        </SidebarProvider>
      </div>
    </AuthGuard>
  );
}

export default Layout;