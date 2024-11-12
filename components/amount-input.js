import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const AmountInput = React.forwardRef(
  (
    {
      value,
      onChange,
      setTotalAmount,
      fields,
      placeholder,
      className,
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      const newValue = e.target.value;

      // Allow empty input
      if (newValue === "") {
        onChange("");
        return;
      }

      // Allow numbers with up to 2 decimal places
      const priceRegex = /^\d.?\d{0,2}$|^\d.$|^\d*.?\d{0,2}$/;

      if (priceRegex.test(newValue)) {
        onChange(newValue);
      }
    };

    // Convert value to string if it's a number
    const displayValue = value?.toString() || "";

    return (
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal" // Add this to show decimal keyboard on mobile
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder || "0.00"}
          className={cn(
            "flex h-12 w-full rounded-[10px] border border-input bg-background px-3 py-2 pl-6 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground peer-disabled:opacity-50">
          £
        </span>
        <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-sm text-muted-foreground peer-disabled:opacity-50">
          GBP
        </span>
      </div>
    );
  }
);

AmountInput.displayName = "AmountInput";

export default React.memo(AmountInput);
