import React, { useState, useRef, useEffect } from "react";
import cn from "../../lib/cn";
import { ChevronDown } from "lucide-react";

export const Select = React.forwardRef(({
  label,
  options = [],
  value,
  onChange,
  onBlur,
  className = "",
  disabled = false,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onBlur]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="flex flex-col gap-1.5 w-full text-left" ref={containerRef}>
      {label && (
        <label className="text-sm font-semibold text-gray-200">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          ref={ref}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "w-full px-3 py-2.5 text-sm font-[inherit] box-border appearance-none text-left flex items-center justify-between",
            "border-[1.5px] rounded-xl outline-none transition-all duration-200",
            "bg-[#16171d] text-gray-100",
            isOpen ? "border-primary ring-3 ring-primary/20" : "border-gray-600 focus:border-primary focus:ring-3 focus:ring-primary/20",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          {...props}
        >
          <span className="truncate pr-4">{selectedOption ? selectedOption.label : "Select an option..."}</span>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-[#1c1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto hide-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5",
                  value === opt.value ? "bg-primary/10 text-primary font-medium" : "text-gray-300"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

Select.displayName = "Select";
export default Select;
