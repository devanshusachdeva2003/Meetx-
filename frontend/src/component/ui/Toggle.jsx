import React from "react";
import { motion } from "framer-motion";
import cn from "../../lib/cn";

export const Toggle = React.forwardRef(({
  checked,
  onChange,
  disabled = false,
  className = "",
  size = "default" // default, sm, lg
}, ref) => {
  
  const sizes = {
    sm: {
      container: "w-10 h-5",
      thumb: "w-3 h-3",
      translate: "translate-x-5"
    },
    default: {
      container: "w-12 h-6",
      thumb: "w-4 h-4",
      translate: "translate-x-6"
    },
    lg: {
      container: "w-14 h-7",
      thumb: "w-5 h-5",
      translate: "translate-x-7"
    }
  };

  const currentSize = sizes[size] || sizes.default;

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors duration-300 outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#0B0C10]",
        currentSize.container,
        checked ? "bg-primary" : "bg-white/10 border border-white/5",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <motion.div
        initial={false}
        animate={{
          x: checked ? (size === "sm" ? 20 : size === "lg" ? 28 : 24) : 4
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute bg-white rounded-full shadow-sm",
          currentSize.thumb
        )}
      />
    </button>
  );
});

Toggle.displayName = "Toggle";
export default Toggle;
