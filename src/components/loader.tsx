import { Spinner } from "@/components/ui/spinner";

interface Props {
  label?: string;
}

export const Loader = ({ label }: Props) => {
  return (
    <div className="flex items-center justify-center h-screen space-x-2">
      <Spinner className="size-5 text-primary" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
};