import { cn } from "@/lib/utils";
import { TriangleAlert, Dot } from "lucide-react";

export const FormError = ({ message, className }) => {

    if (!message) return null;
    
  return (
    <div className={cn(
      "border-[1.5px] border-destructive p-3 rounded-md flex flex-col gap-x-2 text-sm text-destructive",
      className
      )}>
      <div className="flex items-center gap-x-2 mb-4">
      <TriangleAlert className="h-5 w-5" />
      <p>Invalid Fields! Please correct the following and retry:</p>
      </div>
      {typeof message === "string" ? (
        <p>{message}</p>
      ) : (
        <ul className="space-y-2">
          {Object.values(message).map((error, index) => (
            <div className="flex items-center gap-x-2" key={index}>
            <Dot />
            <li>{error[0]}</li>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
};
