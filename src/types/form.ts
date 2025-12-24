export const inputVariants = [
  "bigText",
  "numeric",
  "text",
  "selection",
] as const;

export type InputVariants = (typeof inputVariants)[number];

export const formColor = [
  "default",
  "blue",
] as const;

export type FormColor = (typeof formColor)[number];

export type formClassName = {
  form?: string;
  input?: string;
  label?: string;
};

export const formRecord: Record<FormColor, formClassName> = {
  default: {
    form: "grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#fcfcfc08] rounded-sm flex flex-col gap-2",
    input: "w-full dark:shadow-[0_0_0_1px_rgba(188,186,182,0.1)] bg-[#202020] hover:bg-[#262626] transition text-primary focus:outline-none focus:ring-0 rounded-sm p-2.5 text-sm leading-tight h-full min-h-10",
    label: "whitespace-nowrap text-sm text-[#bcbab6]",
  },
  blue: {
    form: "grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2",
    input: "w-full dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] min-h-10 bg-[#202020] hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 rounded-sm p-2.5 text-sm leading-tight h-full",
    label: "whitespace-nowrap text-sm text-marine",
  },
};