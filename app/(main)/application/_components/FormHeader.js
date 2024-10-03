"use client";

import { FormSteps } from "./FormSteps";

export const FormHeader = ({ currentStepIndex }) => {

    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center lg:items-start mb-6 lg:mb-8">
          <div className="text-center lg:text-left">
            <h1 className="font-semibold text-xl sm:text-2xl lg:text-[25px]">
              Online Admission Application
            </h1>
            <span className="text-xs sm:text-sm lg:text-[14px] text-[#929EAE]">
              Fill in all the required fields to move to the next step
            </span>
          </div>
        </div>

        <FormSteps currentStepIndex={currentStepIndex} />
      </div>
    );
}