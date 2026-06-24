import React from "react";
import cn from "../../lib/cn";

const variants = {
  default: "gradient-primary shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)]",
  outline: "bg-transparent border-[1.5px] border-border text-foreground hover:bg-muted hover:border-primary hover:text-primary",
  ghost:   "bg-transparent text-foreground hover:bg-muted",
  none:    "bg-transparent shadow-none hover:shadow-none hover:-translate-y-0",
  danger:  "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
  "outline-danger": "bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
  glass:   "bg-card hover:bg-muted text-foreground border border-border",
  soft:    "bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20",
};

const sizes = {
  default: "px-5 py-2.5 rounded-xl text-sm",
  sm: "px-3 py-1.5 rounded-lg text-xs",
  lg: "px-6 py-3 rounded-2xl text-base",
  icon: "p-2 rounded-full",
  "icon-lg": "p-4 rounded-full",
  none: "",
};

export const Button = React.forwardRef(({
  children,
  className = "",
  variant = "default",
  size = "default",
  disabled,
  ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled}
    className={cn(
      "inline-flex items-center justify-center gap-2 font-semibold tracking-wide",
      "border-0 outline-none cursor-pointer transition-all duration-200",
      "disabled:opacity-55 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
      variants[variant],
      sizes[size],
      className
    )}
    {...props}
  >
    {children}
  </button>
));

Button.displayName = "Button";

export default Button;
