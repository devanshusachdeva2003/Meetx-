import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import cn from "../../lib/cn";

const ControlledTextArea = ({
  field,
  label,
  wrapperClassName,
  inputClassName,
  rows = 3,
  ...rest
}) => {
  const { control } = useFormContext();
  const displayLabel = label || field.label;

  return (
    <Controller
      name={field.name}
      control={control}
      defaultValue={field.defaultValue || ""}
      rules={field.validation}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <div className={cn("flex flex-col gap-1.5 w-full", wrapperClassName)}>
          {displayLabel && (
            <label htmlFor={field.name} className="text-sm font-semibold text-foreground">
              {displayLabel}
            </label>
          )}
          <textarea
            id={field.name}
            ref={ref}
            placeholder={field.placeholder}
            onChange={onChange}
            onBlur={onBlur}
            value={value}
            rows={rows}
            className={cn(
              "w-full px-3 py-2.5 text-sm font-[inherit] box-border resize-none",
              "border-[1.5px] rounded-xl outline-none transition-all duration-300",
              "bg-input text-foreground",
              "placeholder:text-muted-foreground",
              error
                ? "border-red-400 focus:border-red-400 focus:ring-3 focus:ring-red-400/20"
                : "border-border focus:border-primary focus:ring-3 focus:ring-primary/20",
              inputClassName
            )}
            {...rest}
          />
          {error && (
            <span className="text-xs text-red-400 font-medium">
              {error.message}
            </span>
          )}
        </div>
      )}
    />
  );
};

export default ControlledTextArea;
