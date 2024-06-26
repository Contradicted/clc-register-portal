"use client";

import { FormSteps } from "./FormSteps";

export const FormHeader = ({ currentStepIndex }) => {

    return (
      <div>
        <div className="w-full flex flex-col items-center justify-center lg:items-start">
          <div className="flex flex-col text-center lg:text-left">
            <h1 className="font-semibold text-[25px]">
              Online Admission Application
            </h1>
            <span className="text-[14px] text-[#929EAE]">
              Fill in all the required fields to move to the next step
            </span>
          </div>
        </div>

        <FormSteps currentStepIndex={currentStepIndex} />
      </div>
    );
}