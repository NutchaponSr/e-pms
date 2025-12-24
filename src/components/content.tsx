import { IconType } from "react-icons";

interface Props {
  icon?
  : IconType;
  label: string;
  children: React.ReactNode;
}

export const Content = ({
  label,
  icon: Icon,
  children
}: Props) => {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-row">
        <div className="flex items-center leading-4.5 min-w-0 text-xs text-secondary">
          {Icon && <Icon className="size-3.5 me-1" />}
          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </div>
        </div>
      </div>
      
      {children}
    </div>
  );
}