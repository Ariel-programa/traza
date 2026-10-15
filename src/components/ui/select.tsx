import * as React from "react";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/ui/input";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select className={cn(inputClass, "pr-8 appearance-none bg-no-repeat", className)} ref={ref} {...props}>
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
