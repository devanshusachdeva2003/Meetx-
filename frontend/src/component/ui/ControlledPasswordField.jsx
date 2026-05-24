import React, { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import cn from "../../lib/cn";

const ControlledPasswordField = ({
  field,
  label,
  wrapperClassName,
  inputClassName,
  ...rest
}) => {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Controller
      name={field.name}
      control={control}
      defaultValue={field.defaultValue || ""}
      rules={field.validation}
      render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
        <div className={cn("flex flex-col gap-1.5 w-full", wrapperClassName)}>
          {label && (
            <label htmlFor={field.name} className="text-sm font-semibold text-gray-200">
              {label}
            </label>
          )}
          <div className="relative flex items-center w-full">
            <input
              id={field.name}
              ref={ref}
              type={showPassword ? "text" : "password"}
              placeholder={field.placeholder}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
              className={cn(
                "w-full pl-3 pr-10 py-2.5 text-sm font-[inherit] box-border",
                "border-[1.5px] rounded-xl outline-none transition-all duration-200",
                "bg-[#16171d] text-gray-100",
                "placeholder:text-gray-500",
                error
                  ? "border-red-400 focus:border-red-400 focus:ring-3 focus:ring-red-400/20"
                  : "border-gray-600 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20",
                inputClassName
              )}
              {...rest}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-200"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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

export default ControlledPasswordField;
