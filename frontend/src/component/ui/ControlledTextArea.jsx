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
            <label htmlFor={field.name} className="text-sm font-semibold text-foreground text-gray-300">
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
              "w-full px-4 py-3 text-sm font-[inherit] box-border resize-none",
              "border rounded-xl outline-none transition-all duration-200",
              "bg-input/50 text-white",
              "placeholder:text-gray-500",
              error
                ? "border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                : "border-border focus:border-primary focus:ring-1 focus:ring-primary",
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
