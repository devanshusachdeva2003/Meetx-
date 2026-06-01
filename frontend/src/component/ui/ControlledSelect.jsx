import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import Select from "./Select";
import cn from "../../lib/cn";

const ControlledSelect = ({
  field,
  label,
  options,
  wrapperClassName,
  ...rest
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={field.name}
      control={control}
      defaultValue={field.defaultValue || (options?.[0]?.value ?? "")}
      rules={field.validation}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <div className={cn("w-full", wrapperClassName)}>
          <Select
            ref={ref}
            label={label}
            options={options}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={error ? "border-red-400 focus:border-red-400" : ""}
            {...rest}
          />
          {error && (
            <span className="text-xs text-red-400 font-medium mt-1 block">
              {error.message}
            </span>
          )}
        </div>
      )}
    />
  );
};

export default ControlledSelect;
