"use client";

import { useMultiStepForm } from "@/hooks/useMultiStepForm";
import { StepOneForm } from "./StepOneForm";
import { FormHeader } from "./FormHeader";
import { StepTwoForm } from "./StepTwoForm";

export const Forms = ({ formData, userData }) => {
  const {
    currentStepIndex,
    nextStep,
    previousStep,
    applicationData,
    accumulatedFiles,
    fData,
    updateData,
    deletedQualifications,
    deletedPendingQualifications,
    setDeletedPendingQualifications,
    setAccumulatedFiles,
    setDeletedQualifications,
  } = useMultiStepForm(5, formData);

  // console.log('tet', formData)

  const forms = [
    <StepOneForm
      userDetails={userData}
      application={applicationData}
      nextStep={nextStep}
      fData={fData}
      updateData={updateData}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      deletedPendingQualifications={deletedPendingQualifications}
      deletedQualifications={deletedQualifications}
    />,
    <StepTwoForm
      application={applicationData}
      previousStep={previousStep}
      nextStep={nextStep}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      fData={fData}
      updateData={updateData}
      deletedPendingQualifications={deletedPendingQualifications}
      setDeletedPendingQualifications={setDeletedPendingQualifications}
      deletedQualifications={deletedQualifications}
      setDeletedQualifications={setDeletedQualifications}
    />,
  ];

  return (
    <div className="h-full w-full pt-12 flex flex-col">
      <FormHeader currentStepIndex={currentStepIndex} />

      <main className="flex flex-1 mt-[50px]">{forms[currentStepIndex]}</main>
    </div>
  );
};
