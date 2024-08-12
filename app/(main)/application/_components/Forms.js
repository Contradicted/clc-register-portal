"use client";

import { useMultiStepForm } from "@/hooks/useMultiStepForm";
import { StepOneForm } from "./StepOneForm";
import { FormHeader } from "./FormHeader";
import { StepTwoForm } from "./StepTwoForm";
import { StepThreeForm } from "./StepThreeForm";
import { StepFourForm } from "./StepFourForm";
import { StepFiveForm } from "./StepFiveForm";
import { StepSixForm } from "./StepSixForm";

export const Forms = ({ formData, userData }) => {
  const {
    currentStepIndex,
    isFirstStep,
    isLastStep,
    nextStep,
    previousStep,
    applicationData,
    accumulatedFiles,
    fData,
    updateData,
    deletedQualifications,
    deletedPendingQualifications,
    deletedWorkExperiences,
    setDeletedPendingQualifications,
    setAccumulatedFiles,
    setDeletedQualifications,
    setDeletedWorkExperiences,
  } = useMultiStepForm(6, formData);

  const forms = [
    <StepOneForm
      userDetails={userData}
      isFirstStep={isFirstStep}
      application={applicationData}
      nextStep={nextStep}
      fData={fData}
      updateData={updateData}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      deletedPendingQualifications={deletedPendingQualifications}
      deletedQualifications={deletedQualifications}
      deletedWorkExperiences={deletedWorkExperiences}
    />,
    <StepTwoForm
      application={applicationData}
      previousStep={previousStep}
      nextStep={nextStep}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      fData={fData}
      updateData={updateData}
      deletedQualifications={deletedQualifications}
      deletedPendingQualifications={deletedPendingQualifications}
      deletedWorkExperiences={deletedWorkExperiences}
      setDeletedPendingQualifications={setDeletedPendingQualifications}
      setDeletedQualifications={setDeletedQualifications}
    />,
    <StepThreeForm
      application={applicationData}
      previousStep={previousStep}
      nextStep={nextStep}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      fData={fData}
      updateData={updateData}
      deletedPendingQualifications={deletedPendingQualifications}
      deletedQualifications={deletedQualifications}
      deletedWorkExperiences={deletedWorkExperiences}
      setDeletedWorkExperiences={setDeletedWorkExperiences}
    />,
    <StepFourForm
      application={applicationData}
      previousStep={previousStep}
      nextStep={nextStep}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      fData={fData}
      updateData={updateData}
      deletedPendingQualifications={deletedPendingQualifications}
      deletedQualifications={deletedQualifications}
      deletedWorkExperiences={deletedWorkExperiences}
    />,
    <StepFiveForm
      application={applicationData}
      previousStep={previousStep}
      nextStep={nextStep}
      isLastStep={isLastStep}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      fData={fData}
      updateData={updateData}
      deletedPendingQualifications={deletedPendingQualifications}
      deletedQualifications={deletedQualifications}
      deletedWorkExperiences={deletedWorkExperiences}
    />,
    <StepSixForm
      application={applicationData}
      previousStep={previousStep}
      nextStep={nextStep}
      isLastStep={isLastStep}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      fData={fData}
      updateData={updateData}
      deletedPendingQualifications={deletedPendingQualifications}
      deletedQualifications={deletedQualifications}
      deletedWorkExperiences={deletedWorkExperiences}
    />,
  ];

  return (
    <div className="h-full w-full pt-12 flex flex-col">
      <FormHeader currentStepIndex={currentStepIndex} />

      <main className="flex flex-1 mt-[50px]">{forms[currentStepIndex]}</main>
    </div>
  );
};
