import { cn } from "@/lib/utils"

export const FormSteps = ({ currentStepIndex }) => {
    return (
      <div className="w-full mt-4 px-5">
        <ul className="flex flex-wrap items-center justify-center gap-[30px]">
          <li
            className={cn(
              "bg-[#2AA996] font-semibold px-5 py-[10px] rounded-[5px] text-white text-[14px]",
              currentStepIndex !== 0 &&
                "bg-transparent border-[1.5px] border-[#F5F5F5] font-medium text-[#929EAE]"
            )}
          >
            Personal Details
          </li>
          <li
            className={cn(
              "bg-[#2AA996] font-semibold px-5 py-[10px] rounded-[5px] text-white text-[14px]",
              currentStepIndex !== 1 &&
                "bg-transparent border-[1.5px] border-[#F5F5F5] font-medium text-[#929EAE]"
            )}
          >
            Qualifications
          </li>
          <li
            className={cn(
              "bg-[#2AA996] font-semibold px-5 py-[10px] rounded-[5px] text-white text-[14px]",
              currentStepIndex !== 2 &&
                "bg-transparent border-[1.5px] border-[#F5F5F5] font-medium text-[#929EAE]"
            )}
          >
            Work Experience
          </li>
          <li
            className={cn(
              "bg-[#2AA996] font-semibold px-5 py-[10px] rounded-[5px] text-white text-[14px]",
              currentStepIndex !== 3 &&
                "bg-transparent border-[1.5px] border-[#F5F5F5] font-medium text-[#929EAE]"
            )}
          >
            Further Information
          </li>
          <li
            className={cn(
              "bg-[#2AA996] font-semibold px-5 py-[10px] rounded-[5px] text-white text-[14px]",
              currentStepIndex !== 4 &&
                "bg-transparent border-[1.5px] border-[#F5F5F5] font-medium text-[#929EAE]"
            )}
          >
            Marketing Information
          </li>
        </ul>
      </div>
    );
}   