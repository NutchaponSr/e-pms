import { Header } from "@/components/header";

const Layout = (props: LayoutProps<"/performance">) => {
  return (
    <div className="order-3 flex flex-col w-full overflow-hidden isolation-auto bg-transparent relative">
      <Header />
      <main className="grow-0 shrink flex flex-col bg-background z-1 h-full max-h-full w-full">
        <div className="contents">
          {props.children}
        </div>
      </main>
    </div>
  );
}

export default Layout;