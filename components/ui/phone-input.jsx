import { CheckIcon, ChevronsUpDown } from "lucide-react";

import * as React from "react";

import * as RPNInput from "react-phone-number-input";

import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { ScrollArea } from "./scroll-area";

const PhoneInput = React.forwardRef(
  ({ className, onChange, formError, ...props }, ref) => {
    return (
      <RPNInput.default
        ref={ref}
        className={cn("flex", className)}
        flagComponent={(props) => <FlagComponent {...props} />}
        countrySelectComponent={CountrySelectWrapper}
        countrySelectProps={{ formError }}
        inputComponent={InputComponentWrapper}
        formError={formError}
        onChange={(value) => onChange?.(value || "")}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";

const InputComponentWrapper = React.forwardRef((props, ref) => {
  const { formError, ...inputProps } = props;
  return (
    <InputComponent
      {...inputProps}
      ref={ref}
      className={inputProps.className}
      formError={formError}
    />
  );
});
InputComponentWrapper.displayName = "InputComponentWrapper";

const InputComponent = React.forwardRef(
  ({ className, formError, ...props }, ref) => (
    <Input
      {...props}
      className={cn(
        "rounded-e-lg rounded-s-none",
        className,
        formError && "border-red-500"
      )}
      ref={ref}
    />
  )
);
InputComponent.displayName = "InputComponent";

const CountrySelectWrapper = React.forwardRef((props, ref) => {
  const { formError, ...countrySelectProps } = props;
  return (
    <CountrySelect {...countrySelectProps} ref={ref} formError={formError} />
  );
});
CountrySelectWrapper.displayName = "CountrySelectWrapper";

const CountrySelect = React.forwardRef(
  ({ disabled, value, onChange, options, formError, ...props }, ref) => {
    const handleSelect = React.useCallback(
      (country) => {
        onChange(country);
      },
      [onChange]
    );

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={"outline"}
            className={cn(
              "flex gap-1 rounded-e-none rounded-s-lg px-3 h-12 border-r-0",
              formError && "border-red-500"
            )}
            disabled={disabled}
          >
            <FlagComponent country={value} countryName={value} />
            <ChevronsUpDown
              className={cn(
                "-mr-2 h-4 w-4 opacity-50",
                disabled ? "hidden" : "opacity-100"
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandList>
              <ScrollArea className="h-72">
                <CommandInput placeholder="Search country..." />
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {options
                    .filter((x) => x.value)
                    .map((option) => (
                      <CommandItem
                        className="gap-2"
                        key={option.value}
                        onSelect={() => handleSelect(option.value)}
                      >
                        <FlagComponent
                          country={option.value}
                          countryName={option.label}
                        />
                        <span className="flex-1 text-sm">{option.label}</span>
                        {option.value && (
                          <span className="text-sm text-foreground/50">
                            {`+${RPNInput.getCountryCallingCode(option.value)}`}
                          </span>
                        )}
                        <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            option.value === value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
CountrySelect.displayName = "CountrySelect";

const FlagComponent = ({ country, countryName }) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};
FlagComponent.displayName = "FlagComponent";

export { PhoneInput };