import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { CSSProperties } from "react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InputVariants } from "@/types/form";
import { cn } from "@/lib/utils";

type TextareaRefCallback = (element: HTMLTextAreaElement | null) => void;

interface Props<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  label?: string;
  form: UseFormReturn<TFieldValues>;
  variant: InputVariants;
  placeholder?: string;
  className?: {
    form?: string;
    input?: string;
    label?: string;
  };
  disabled: boolean;
  style?: CSSProperties;
  selectOptions?: Array<{ key: string; label: string }>;
  textareaRef?: TextareaRefCallback;
  onInput?: () => void;
  fileUpload?: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}

interface RenderProps<TFieldValues extends FieldValues> {
  field: ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>;
  placeholder?: string;
  className?: string;
  disabled: boolean;
  selectOptions?: Array<{
    key: string;
    label: string;
  }>;
  style?: CSSProperties;
  textareaRef?: TextareaRefCallback;
  onInput?: () => void;
  fileUpload?: React.ReactNode;
}

type InputRenderer<TFieldValues extends FieldValues> = (
  props: RenderProps<TFieldValues>,
) => React.ReactElement;

export const FormGenerator = <TFieldValues extends FieldValues>({
  name,
  form,
  label,
  variant,
  disabled,
  placeholder,
  className,
  selectOptions,
  style,
  textareaRef,
  onInput,
  fileUpload,
  description,
  children,
}: Props<TFieldValues>) => {
  const INPUT_RENDERERS: Partial<
    Record<InputVariants, InputRenderer<TFieldValues>>
  > = {
    bigText: BigText,
    numeric: Numeric,
    selection: Selection,
    text: Text,
  } as const;

  const render = INPUT_RENDERERS[variant] ?? Text;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className?.form}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {label ? <FormLabel className={className?.label}>{label}</FormLabel> : null}
              {description ? <FormDescription className="text-xs text-secondary whitespace-nowrap text-ellipsis overflow-hidden">{description}</FormDescription> : null}
            </div>

            {children}
          </div>
          <FormControl>
            {render({
              field,
              disabled,
              placeholder,
              selectOptions,
              className: className?.input,
              style,
              textareaRef,
              onInput,
            })}
          </FormControl>
          {fileUpload ? fileUpload : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const BigText = <TFieldValues extends FieldValues>({
  field,
  placeholder,
  className,
  disabled,
  textareaRef,
  onInput,
}: RenderProps<TFieldValues>) => {
  if (disabled) {
    return (
      <div className={className}>
        {field.value ?? ""}
      </div>
    );
  }

  return (
    <textarea
      {...field}
      rows={1}
      ref={(el) => {
        if (textareaRef) {
          textareaRef(el);
        }
        field.ref(el);
      }}
      onInput={onInput}
      value={field.value ?? ""}
      onChange={(e) => field.onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(className, "resize-none overflow-hidden whitespace-pre-wrap wrap-break-word")}
    />
  );
};

const Numeric = <TFieldValues extends FieldValues>({
  field,
  placeholder,
  className,
  disabled,
}: RenderProps<TFieldValues>) => {  
  if (disabled) {
    return (
      <div className={className}>
        {field.value ?? ""}
      </div>
    );
  }

  return (
    <input
      {...field}
      type="number"
      value={field.value ?? ""}
      onChange={(e) => field.onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(className, "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-0 min-h-10")}
      disabled={disabled}
    />
  );
};

const Text = <TFieldValues extends FieldValues>({
  field,
  placeholder,
  className,
  disabled,
}: RenderProps<TFieldValues>) => {
  if (disabled) {
    return (
      <div className={className}>
        {field.value ?? ""}
      </div>
    );
  }

  return (
    <input
      {...field}
      type="text"
      value={field.value ?? ""}
      onChange={(e) => field.onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(className)}
      disabled={disabled}
    />
  );
};

const Selection = <TFieldValues extends FieldValues>({
  field,
  placeholder,
  className,
  disabled,
  selectOptions,
}: RenderProps<TFieldValues>) => {
  if (disabled) {
    return (
      <div className={className}>
        {field.value ?? ""}
      </div>
    );
  }

  return (
    <Select onValueChange={field.onChange}>
      <SelectTrigger className="w-full dark:shadow-[0_0_0_1px_rgba(39,131,222,0.1)] min-h-10 bg-[#202020] hover:bg-[#213041] transition text-primary data-placeholder:text-marine border-none">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="center" side="bottom">
        {selectOptions?.map(({ key, label }) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
