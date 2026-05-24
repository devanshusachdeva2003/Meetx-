import React from "react";
import cn from "../../lib/cn";

const variants = {
  default: "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:from-indigo-400 hover:to-indigo-600 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]",
  outline: "bg-transparent border-[1.5px] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-indigo-500/10 hover:border-indigo-500 hover:text-indigo-500",
  ghost:   "bg-transparent text-gray-900 dark:text-gray-100 hover:bg-indigo-500/10",
};

export const Button = ({
  children,
  className = "",
  variant = "default",
  disabled,
  ...props
}) => (
  <button
    disabled={disabled}
    className={cn(
      "inline-flex items-center justify-center gap-2",
      "px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide",
      "border-0 outline-none cursor-pointer",
      "transition-all duration-200",
      "disabled:opacity-55 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
      variants[variant],
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

export default Button;
