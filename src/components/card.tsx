interface Props {
  children: React.ReactNode;
}

export const Card = ({ children }: Props) => {
  return (
    <div className="top-0 start-0 w-full translate-y-0">
      <div className="contents">
        <div className="relative p-4 bg-[#202020] dark:shadow-[inset_0_0_0_1.25px_#ffffff0d] dark:hover:shadow-[inset_0_0_0_1.25px_#ffffff1a] rounded-sm">
          {children}
        </div>
      </div>
    </div>
  );
}