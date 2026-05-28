import React from "react";
import { useFormContext, useController } from "react-hook-form";
import OtpInput from "react-otp-input";
import { twMerge } from "tailwind-merge";

const ControlledOTPInput = ({ 
  name, 
  label, 
  otpLength = 6, 
  containerClassName = "",
  labelClassName = "",
  inputClassName = "",
  gap = "0.5rem",
  ...props
}) => {
  const { control } = useFormContext();

  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules: {
      required: "One-time security code is required",
      minLength: {
        value: otpLength,
        message: `Please enter all ${otpLength} digits`,
      },
      maxLength: otpLength,
    },
  });

  const codeString =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value.join("")
        : "";

  return (
    <div className={twMerge("flex flex-col", containerClassName)}>
      {label && (
        <label className={twMerge("text-sm font-medium text-gray-300 mb-2", labelClassName)}>
          {label}
        </label>
      )}
      
      <div className="w-full">
        <OtpInput
          value={codeString}
          onChange={(val) => {
            const digitsOnly = val.replace(/\D/g, "");
            onChange(digitsOnly);
          }}
          numInputs={otpLength}
          isInputNum
          shouldAutoFocus
          renderInput={(inputProps) => (
            <input
              {...inputProps}
              className={twMerge(
                "!w-10 !h-12 sm:!w-12 sm:!h-14 text-xl font-bold text-center bg-input border border-border text-white rounded-xl shadow-sm outline-none transition-all duration-200",
                "focus:border-primary focus:ring-1 focus:ring-primary/50",
                error ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : "",
                inputClassName
              )}
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) => {
                // Allow: digits, backspace, delete, arrow keys
                const allowedKeys = [
                  "Backspace",
                  "Delete",
                  "ArrowLeft",
                  "ArrowRight",
                  "Tab",
                  "Enter",
                ];

                const isModifierCombo = e.ctrlKey || e.metaKey;
                if (
                  !/^[0-9]$/.test(e.key) &&
                  !allowedKeys.includes(e.key) &&
                  !isModifierCombo
                ) {
                  e.preventDefault();
                  return;
                }
                
                if (inputProps.onKeyDown) {
                  inputProps.onKeyDown(e);
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData("text") || "";
                if (!pasted) return;
                e.preventDefault();
                const digitsOnly = pasted
                  .replace(/\D/g, "")
                  .slice(0, otpLength);
                if (digitsOnly) {
                  onChange(digitsOnly);
                }
              }}
            />
          )}
          containerStyle={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            gap: gap
          }}
          {...props}
        />
      </div>
      {error && (
        <div className="mt-2 text-center w-full">
          <p className="text-red-400 text-sm">{error.message}</p>
        </div>
      )}
    </div>
  );
};

export default ControlledOTPInput;
