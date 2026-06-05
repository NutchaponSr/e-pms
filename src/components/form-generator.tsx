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
  isError?: boolean;
  name: FieldPath<TFieldValues>;
  label?: string;
  form: UseFormReturn<TFieldValues>;
  variant: InputVariants;
  placeholder?: string;
  className?: {
    form?: string;
    input?: string;
    label?: string;
    description?: string;
  };
  disabled: boolean;
  style?: CSSProperties;
  selectOptions?: Array<{ key: string; label: string }>;
  textareaRef?: TextareaRefCallback;
  onInput?: () => void;
  fileUpload?: React.ReactNode;
  description?: string;
  maxLength?: number;
  fillHeight?: boolean;
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
  maxLength?: number;
  fillHeight?: boolean;
}

type InputRenderer<TFieldValues extends FieldValues> = (
  props: RenderProps<TFieldValues>,
) => React.ReactElement;

export const FormGenerator = <TFieldValues extends FieldValues>({
  isError,
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
  maxLength,
  fillHeight,
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
        <FormItem
          className={cn(
            className?.form,
            fillHeight && "lg:flex lg:flex-1 lg:flex-col lg:min-h-0",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              {label ? <FormLabel className={cn("whitespace-nowrap text-ellipsis overflow-hidden", className?.label)}>{label}</FormLabel> : null}
              {description ? <FormDescription className={cn(
                  "text-xs text- whitespace-nowrap text-ellipsis overflow-hidden", className?.description,
                  isError && "text-destructive"
                )}
              >
                {description}
              </FormDescription> : null
              }
            </div>

            {children}
          </div>
          <FormControl>
            <div
              className={cn(
                "flex flex-col gap-1",
                fillHeight && "lg:flex-1 lg:min-h-0",
              )}
            >
              {render({
                field,
                disabled,
                placeholder,
                selectOptions,
                className: className?.input,
                style,
                textareaRef,
                onInput,
                maxLength,
                fillHeight,
              })}
              {maxLength != null && (
                <p
                  className={cn(
                    "text-xs text-end tabular-nums",
                    String(field.value ?? "").length >= maxLength
                      ? "text-destructive"
                      : "text-secondary",
                  )}
                >
                  {String(field.value ?? "").length}/{maxLength}
                </p>
              )}
            </div>
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
  maxLength,
  fillHeight,
}: RenderProps<TFieldValues>) => {
  const fillHeightClass = fillHeight ? "lg:h-full lg:min-h-10 lg:flex-1" : undefined;
  const overflowClass = fillHeight ? "lg:overflow-auto" : "overflow-hidden";

  if (disabled) {
    return (
      <div
        className={cn(
          className,
          fillHeightClass,
          "min-w-0 whitespace-pre-wrap wrap-break-word",
          fillHeight ? "lg:overflow-auto" : "overflow-hidden",
        )}
      >
        {field.value ?? ""}
      </div>
    );
  }

  return (
    <textarea
      {...field}
      rows={1}
      ref={(el) => {
        if (fillHeight && el) {
          el.style.height = "";
        }
        if (textareaRef) {
          textareaRef(el);
        }
        field.ref(el);
      }}
      onInput={onInput}
      value={field.value ?? ""}
      maxLength={maxLength}
      onChange={(e) => {
        const value = maxLength != null ? e.target.value.slice(0, maxLength) : e.target.value;
        field.onChange(value);
      }}
      placeholder={placeholder}
      className={cn(
        className,
        fillHeightClass,
        "resize-none whitespace-pre-wrap wrap-break-word",
        overflowClass,
      )}
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
    <Select value={field.value ?? ""} onValueChange={field.onChange}>
      <SelectTrigger className={cn(className)}>
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
