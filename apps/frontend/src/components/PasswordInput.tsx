import { forwardRef, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  id?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  variant?: "light" | "dark";
  label?: string;
  labelClassName?: string;
  formError?: string;
}

export const PasswordInput = forwardRef<HTMLDivElement, PasswordInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      placeholder = "",
      id,
      autoFocus = false,
      disabled = false,
      variant = "light",
      label,
      labelClassName = "",
      formError,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const hasError = !!formError;

    // Sync display with value and showPassword state
    useEffect(() => {
      const newDisplay = showPassword ? value : value.replace(/./g, "•");

      // Update the contentEditable if not actively typing
      if (
        internalRef.current &&
        document.activeElement !== internalRef.current
      ) {
        internalRef.current.textContent = newDisplay;
      }
    }, [value, showPassword]);

    // Handle autofocus
    useEffect(() => {
      if (autoFocus && internalRef.current) {
        internalRef.current.focus();
      }
    }, [autoFocus]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const currentText = e.currentTarget.textContent || "";

      if (showPassword) {
        // If showing password, just update normally
        onChange(currentText);
      } else {
        // If showing dots, we need to figure out what was typed
        const cursorPos = window.getSelection()?.focusOffset || 0;
        const previousLength = value.length;
        const currentLength = currentText.length;

        if (currentLength > previousLength) {
          // Characters were added
          const numAdded = currentLength - previousLength;
          const insertPos = cursorPos - numAdded;
          const newChars = currentText.slice(insertPos, cursorPos);
          const newPassword =
            value.slice(0, insertPos) + newChars + value.slice(insertPos);
          onChange(newPassword);
        } else if (currentLength < previousLength) {
          // Characters were deleted
          const numDeleted = previousLength - currentLength;
          const deletePos = cursorPos;
          const newPassword =
            value.slice(0, deletePos) + value.slice(deletePos + numDeleted);
          onChange(newPassword);
        }

        // Update display to dots immediately
        const maskedText = currentText.replace(/./g, "•");
        e.currentTarget.textContent = maskedText;

        // Restore cursor position
        const sel = window.getSelection();
        if (sel && e.currentTarget.childNodes.length > 0) {
          const range = document.createRange();
          const textNode = e.currentTarget.childNodes[0];
          const pos = Math.min(cursorPos, maskedText.length);
          range.setStart(textNode, pos);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Prevent Enter key from adding newlines
      if (e.key === "Enter") {
        e.preventDefault();
        const form = internalRef.current?.closest("form");
        if (form) {
          form.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          );
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text/plain");

      // Insert pasted text at cursor position
      const sel = window.getSelection();
      const cursorPos = sel?.focusOffset || value.length;
      const newPassword =
        value.slice(0, cursorPos) + pastedText + value.slice(cursorPos);

      onChange(newPassword);

      // Update display
      if (internalRef.current) {
        const displayValue = showPassword
          ? newPassword
          : newPassword.replace(/./g, "•");
        internalRef.current.textContent = displayValue;

        // Move cursor to end of pasted text
        if (sel && internalRef.current.childNodes.length > 0) {
          const range = document.createRange();
          const textNode = internalRef.current.childNodes[0];
          const newPos = Math.min(
            cursorPos + pastedText.length,
            displayValue.length
          );
          range.setStart(textNode, newPos);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Update display and move cursor to end
      if (internalRef.current) {
        const display = showPassword ? value : value.replace(/./g, "•");
        internalRef.current.textContent = display;

        setTimeout(() => {
          const range = document.createRange();
          const sel = window.getSelection();
          if (
            internalRef.current &&
            internalRef.current.childNodes.length > 0
          ) {
            const textNode = internalRef.current.childNodes[0];
            range.setStart(textNode, display.length);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }, 0);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    const togglePasswordVisibility = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent wrapper click from firing
      const newShowPassword = !showPassword;
      setShowPassword(newShowPassword);

      // Update display immediately
      if (internalRef.current) {
        const sel = window.getSelection();
        const cursorPos = sel?.focusOffset || value.length;

        const newDisplay = newShowPassword ? value : value.replace(/./g, "•");
        internalRef.current.textContent = newDisplay;

        // Restore cursor if focused
        if (isFocused && internalRef.current.childNodes.length > 0) {
          setTimeout(() => {
            const range = document.createRange();
            const textNode = internalRef.current!.childNodes[0];
            const pos = Math.min(cursorPos, newDisplay.length);
            range.setStart(textNode, pos);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
            internalRef.current!.focus();
          }, 0);
        }
      }
    };

    // Build className based on variant and state
    const getClassName = () => {
      const baseClasses =
        "w-full h-12 px-3 border rounded-md transition-all duration-200 text-sm outline-none cursor-text pr-10 flex items-center";

      const variantClasses =
        variant === "dark"
          ? "bg-white/10 backdrop-blur-sm text-white placeholder-gray-400"
          : "bg-white text-gray-900 placeholder-gray-400";

      const borderClasses = hasError
        ? "border-destructive ring-destructive/20 dark:ring-destructive/40"
        : variant === "dark"
        ? "border-white/30"
        : "border-input";

      const focusClasses = isFocused
        ? "border-ring ring-ring/50 ring-[3px]"
        : "";

      return `${baseClasses} ${variantClasses} ${borderClasses} ${focusClasses}`;
    };

    const handleLabelClick = () => {
      if (internalRef.current) {
        internalRef.current.focus();
      }
    };

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            onClick={handleLabelClick}
            className={`text-sm font-medium cursor-pointer ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <div
            ref={(node) => {
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              if (node) {
                (
                  internalRef as React.MutableRefObject<HTMLDivElement | null>
                ).current = node;
              }
            }}
            id={id}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={getClassName()}
            style={{
              WebkitUserSelect: "text",
              userSelect: "text",
              whiteSpace: "pre",
              overflowWrap: "normal",
              lineHeight: "2.85rem",
            }}
            suppressContentEditableWarning
            aria-label="Password input"
            role="textbox"
            aria-describedby={placeholder}
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
          />
          {!value && (
            <div className="absolute text-sm text-gray-400 top-0 left-0 h-12 px-3 pointer-events-none flex items-center">
              {placeholder}
            </div>
          )}
          <button
            type="button"
            onMouseDown={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {formError && <p className="text-xs text-red-600">{formError}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
