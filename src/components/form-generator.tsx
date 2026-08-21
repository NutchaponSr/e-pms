import { ScrollArea } from "@radix-ui/react-scroll-area";
import type { CSSProperties } from "react";
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InputVariants } from "@/types/form";

type TextareaRefCallback = (element: HTMLTextAreaElement | null) => void;

const SCROLL_AREA_MIN_HEIGHT_PX = 192;

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
  scrollAreaClassName?: string;
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
  scrollAreaClassName?: string;
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
  scrollAreaClassName,
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
            fillHeight && "flex flex-1 flex-col min-h-0 lg:flex lg:flex-1 lg:flex-col lg:min-h-0",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              {label ? (
                <FormLabel
                  className={cn(
                    "whitespace-nowrap text-ellipsis overflow-hidden",
                    className?.label,
                  )}
                >
                  {label}
                </FormLabel>
              ) : null}
              {description ? (
                <FormDescription
                  className={cn(
                    "text-xs text- whitespace-nowrap text-ellipsis overflow-hidden",
                    className?.description,
                    isError && "text-destructive",
                  )}
                >
                  {description}
                </FormDescription>
              ) : null}
            </div>

            {children}
          </div>
          <FormControl>
            <div
              className={cn(
                "flex flex-col gap-1",
                fillHeight && "min-h-0 flex-1 lg:flex-1 lg:min-h-0",
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
                scrollAreaClassName,
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
  scrollAreaClassName,
  style,
}: RenderProps<TFieldValues>) => {
  const useScrollArea = Boolean(scrollAreaClassName);
  const fillsParent =
    Boolean(fillHeight) ||
    /\b(?:h-full|min-h-full|flex-1)\b/.test(className ?? "");
  const fillHeightClass =
    fillHeight && !useScrollArea
      ? "lg:h-full lg:min-h-10 lg:flex-1"
      : undefined;
  const overflowClass = useScrollArea
    ? undefined
    : fillHeight && !/\boverflow-hidden\b/.test(className ?? "")
      ? "lg:overflow-auto"
      : "overflow-hidden scrollbar-hide";

  const growTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el || !useScrollArea) return;

    const viewport = el.closest(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null;
    const minHeight = viewport?.clientHeight ?? SCROLL_AREA_MIN_HEIGHT_PX;

    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  };

  const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    growTextarea(event.currentTarget);
    onInput?.();
  };

  const innerFieldClass = cn(
    useScrollArea &&
      "min-h-full w-full resize-none border-0 bg-transparent p-2.5 text-sm leading-tight text-primary shadow-none rounded-none outline-none focus-visible:ring-0",
    !useScrollArea && className,
    !useScrollArea && fillHeightClass,
    "min-w-0 whitespace-pre-wrap wrap-break-word",
    !useScrollArea && overflowClass,
  );

  const content = disabled ? (
    <div className={cn(innerFieldClass, useScrollArea && "min-h-full")}>
      {field.value ?? ""}
    </div>
  ) : (
    <textarea
      {...field}
      rows={1}
      ref={(el) => {
        if (fillHeight && el && !useScrollArea) {
          el.style.height = "";
        }
        growTextarea(el);
        if (textareaRef) {
          textareaRef(el);
        }
        field.ref(el);
      }}
      onInput={handleInput}
      value={field.value ?? ""}
      maxLength={maxLength}
      onChange={(e) => {
        const value =
          maxLength != null
            ? e.target.value.slice(0, maxLength)
            : e.target.value;
        field.onChange(value);
      }}
      placeholder={placeholder}
      className={innerFieldClass}
    />
  );

  if (useScrollArea) {
    return (
      <ScrollArea className={cn(className, scrollAreaClassName, "p-0")}>
        {content}
      </ScrollArea>
    );
  }

  const sizeToContent = (el: HTMLTextAreaElement | null) => {
    if (!el || fillsParent || useScrollArea) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  };

  if (disabled) {
    return (
      <div
        className={cn(
          className,
          fillHeightClass,
          "min-w-0 whitespace-pre-wrap wrap-break-word",
          fillHeight ? "lg:overflow-auto" : "overflow-visible",
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
        sizeToContent(el);
        if (textareaRef) {
          textareaRef(el);
        }
        field.ref(el);
      }}
      onInput={(event) => {
        sizeToContent(event.currentTarget);
        onInput?.();
      }}
      value={field.value ?? ""}
      maxLength={maxLength}
      onChange={(e) => {
        const value =
          maxLength != null
            ? e.target.value.slice(0, maxLength)
            : e.target.value;
        field.onChange(value);
      }}
      placeholder={placeholder}
      style={{ ...style, overflow: "hidden" }}
      className={cn(
        "field-sizing-content resize-none whitespace-pre-wrap wrap-break-word",
        fillHeightClass,
        className,
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
    return <div className={className}>{field.value ?? ""}</div>;
  }

  return (
    <input
      {...field}
      type="number"
      value={field.value ?? ""}
      onChange={(e) => field.onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        className,
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-0 min-h-10",
      )}
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
    return <div className={className}>{field.value ?? ""}</div>;
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
    const selectedLabel =
      selectOptions?.find((option) => option.key === String(field.value ?? ""))
        ?.label ??
      field.value ??
      "";

    return <div className={className}>{selectedLabel}</div>;
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
