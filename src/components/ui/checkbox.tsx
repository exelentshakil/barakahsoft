import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Plain native checkbox rather than @radix-ui/react-checkbox — one
// dependency saved, and a single boolean control doesn't need Radix's
// indeterminate-state machinery.
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, checked, ...props }, ref) => {
  return (
    <span className="relative inline-flex h-4 w-4 shrink-0">
      <input ref={ref} type="checkbox" checked={checked} className="peer absolute inset-0 h-4 w-4 cursor-pointer opacity-0" {...props} />
      <span
        className={cn(
          "pointer-events-none flex h-4 w-4 items-center justify-center rounded border border-input bg-background peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          className
        )}
      >
        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>
    </span>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
