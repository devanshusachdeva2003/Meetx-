import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import Toggle from "./Toggle";
import cn from "../../lib/cn";

const ControlledToggle = ({
  field,
  label,
  icon,
  wrapperClassName,
  ...rest
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={field.name}
      control={control}
      defaultValue={field.defaultValue ?? true}
      render={({ field: { onChange, value, ref } }) => (
        <div className={cn("flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10", wrapperClassName)}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn("p-2 rounded-lg", value ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400')}>
                {icon(value)}
              </div>
            )}
            {label && <span className="font-semibold text-sm text-white">{label}</span>}
          </div>
          <Toggle ref={ref} checked={value} onChange={onChange} {...rest} />
        </div>
      )}
    />
  );
};

export default ControlledToggle;
