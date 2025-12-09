export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-[minmax(0,440px)] grid-rows-[min-content_min-content_24px] p-4 items-center justify-center min-w-80 min-h-dvh content-between">
      <div className="row-start-2 pb-9 pt-4 gap-5 flex flex-col justify-start box-border">
        {children}
      </div>
      <small className="row-start-3 place-self-end leading-5 mx-auto">
        Terms of Services and Privacy Policy
      </small>
    </div>
  );
}