import { cn } from "@/lib/utils"

export const FormSteps = ({ currentStepIndex, hideEqualOpportunities }) => {
    const steps = [
      "Personal Details",
      "Qualifications",
      "Work Experience",
      "Further Information",
      !hideEqualOpportunities && "Equal Opportunities Monitoring",
      "Marketing Information",
    ].filter(Boolean);

    return (
      <div className="w-full mt-4 px-2 sm:px-5">
        <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-[30px]">
          {steps.map((step, index) => (
            <li
              key={index}
              className={cn(
                "bg-[#2AA996] font-semibold px-2 sm:px-3 md:px-4 lg:px-5 py-2 sm:py-[10px] rounded-[5px] text-white text-[12px] sm:text-[14px]",
                currentStepIndex !== index &&
                  "bg-transparent border border-[#F5F5F5] font-medium text-[#929EAE]",
                "whitespace-nowrap mb-2 sm:mb-0"
              )}
            >
              {step}
            </li>
          ))}
        </ul>
      </div>
    );
}   