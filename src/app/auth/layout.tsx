import { AuthLayout } from "@/modules/auth/ui/layouts/auth-layout";

const Layout = (props: LayoutProps<"/auth">) => {
  return (
    <AuthLayout>
      {props.children}
    </AuthLayout>
  );
}

export default Layout;