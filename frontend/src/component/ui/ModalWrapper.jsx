import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import cn from "../../lib/cn";

const ModalWrapper = ({
  open,
  onClose,
  children,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  showBackdrop = true,
  showCloseButton = true,
  className = "",
  topIcon = null,
  showAnimation = false,
  blurBackground = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [modalIndex, setModalIndex] = useState(1);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      if (showAnimation) {
        setTimeout(() => setIsAnimating(true), 10);
      } else {
        setIsAnimating(true);
      }
    } else {
      if (showAnimation) {
        setIsAnimating(false);
        setTimeout(() => setIsVisible(false), 300);
      } else {
        setIsAnimating(false);
        setIsVisible(false);
      }
    }
  }, [open, showAnimation]);

  // Close on ESC
  useEffect(() => {
    if (!open || disableEscapeKeyDown) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        const currentCount = parseInt(document.body.getAttribute("data-modal-count") || "0", 10);
        // Only close if this is the top-most modal
        if (modalIndex === currentCount) {
          onClose?.();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, disableEscapeKeyDown, onClose, modalIndex]);

  useEffect(() => {
    if (open) {
      const currentCount = parseInt(document.body.getAttribute("data-modal-count") || "0", 10);
      const newCount = currentCount + 1;
      setModalIndex(newCount);
      document.body.setAttribute("data-modal-count", newCount.toString());

      if (currentCount === 0) {
        const scrollbarWidth =
          window.innerWidth - document.documentElement.clientWidth;
        const hasScrollbar =
          document.documentElement.scrollHeight > window.innerHeight;

        document.body.style.setProperty("overflow", "hidden", "important");

        if (hasScrollbar && scrollbarWidth > 0) {
          document.body.style.setProperty(
            "padding-right",
            `${scrollbarWidth}px`,
            "important",
          );
        }
      }

      return () => {
        const count = parseInt(document.body.getAttribute("data-modal-count") || "1", 10);
        const nextCount = Math.max(0, count - 1);

        if (nextCount === 0) {
          document.body.removeAttribute("data-modal-count");
          document.body.style.removeProperty("overflow");
          document.body.style.removeProperty("padding-right");
        } else {
          document.body.setAttribute("data-modal-count", nextCount.toString());
        }
      };
    }
  }, [open]);

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0",
          !disableBackdropClick ? "cursor-pointer" : "cursor-default",
          showBackdrop ? (modalIndex > 1 ? "bg-black/5" : "bg-black/25") : "bg-transparent",
          showAnimation && "transition-opacity duration-300",
          showAnimation && (isAnimating ? "opacity-100" : "opacity-0"),
          blurBackground && "backdrop-blur-xl bg-black/60"
        )}
        onClick={() => {
          if (!disableBackdropClick) onClose?.();
        }}
      ></div>

      {/* Modal Content */}
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden max-w-lg rounded-3xl bg-card border border-white/10 shadow-2xl max-h-full",
          showAnimation && "transition-all duration-300 transform",
          showAnimation && (isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"),
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default ModalWrapper;
