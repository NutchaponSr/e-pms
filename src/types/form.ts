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
    form: "grow-0 shrink-0 basis-auto p-2 h-max bg-[#42230308] dark:bg-[#fcfcfc08] rounded-sm flex flex-col gap-2",
    input: "w-full dark:shadow-[0_0_0_1px_rgba(188,186,182,0.1)] shadow-[0_4px_12px_0_rgba(25,25,25,.029),0_1px_2px_0_rgba(25,25,25,.019),0_0_0_1.25px_#2a1c0012] bg-background hover:bg-[#42230308] dark:hover:bg-[#262626] transition text-primary focus:outline-none focus:ring-0 rounded-sm p-2.5 text-sm leading-tight h-full min-h-10",
    label: "whitespace-nowrap text-sm text-primary",
  },
  blue: {
    form: "grow-0 shrink-0 basis-auto p-2 h-max bg-[#0080d50c] dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2",
    input: "w-full dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] shadow-[0_4px_12px_0_rgba(25,25,25,0.029),0_1px_2px_0_rgba(25,25,25,0.019),0_0_0_1.25px_rgba(0,124,215,0.094)] min-h-10 bg-background hover:bg-[#0070db15] dark:hover:bg-[#213041] transition text-primary focus:outline-none focus:ring-0 rounded-sm p-2.5 text-sm leading-tight h-full",
    label: "whitespace-nowrap text-sm text-marine",
  },
};