import { cn } from "@/lib/utils";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface Props {
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  autoFocus?: boolean;
}

export const InputField = forwardRef<HTMLDivElement, Props>(({
  placeholder = "Enter your text here",
  className,
  onChange,
  defaultValue,
  autoFocus = false,
}, ref) => {
  const divRef = useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!defaultValue);

  useImperativeHandle(ref, () => divRef.current!, []);

  useEffect(() => {
    if (
      divRef.current && 
      defaultValue && 
      divRef.current.textContent !== defaultValue
    )  {
      divRef.current.textContent = defaultValue;
      setIsEmpty(!defaultValue);
    }
  }, [defaultValue]);

  return (
    <div className="relative overflow-hidden w-full">
      <div 
        ref={divRef}
        contentEditable
        onInput={() => {
          if (divRef.current) {
            const content = divRef.current.textContent || "";
            setIsEmpty(!content);
            onChange?.(content);
          }
        }}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        suppressContentEditableWarning
        className={cn(
          "focus-visible:outline-none max-w-full w-full whitespace-break-spaces wrap-break-word caret-primary text-2xl font-bold cursor-text resize-none placeholder:text-description overflow-hidden",
          className
        )}
      >
        {defaultValue}
      </div>
      
      {isEmpty && !isFocused && (
        <div aria-hidden="true" className="pointer-events-none absolute top-0 text-tertiary text-2xl font-normal">
          {placeholder}
        </div>
      )}
    </div>
  )
})

InputField.displayName = "InputField";