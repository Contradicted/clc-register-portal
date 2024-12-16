'use client'

import { useMultiStepForm } from '@/hooks/useMultiStepForm'
import { StepOneForm } from './StepOneForm'
import { FormHeader } from './FormHeader'
import { StepTwoForm } from './StepTwoForm'
import { StepThreeForm } from './StepThreeForm'
import { StepFourForm } from './StepFourForm'
import { StepFiveForm } from './StepFiveForm'
import { StepSixForm } from './StepSixForm'

export const Forms = ({ formData, userData, activeCourses }) => {
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

  // Check if step five (equal opportunities) should be hidden
  const hideEqualOpportunities = applicationData?.hideEqualOpportunities

  // Filter out step five (equal opportunities) if needed
  const getFormSteps = () => {
    const allSteps = [
      <StepOneForm
      key="step-one"
      activeCourses={activeCourses}
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
      key="step-two"
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
      key="step-three"
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
      key="step-four"
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
    !hideEqualOpportunities && (
      <StepFiveForm
      key="step-five"
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
    />
    ),
    <StepSixForm
      key="step-six"
      application={applicationData}
      previousStep={previousStep}
      nextStep={nextStep}
      isLastStep={hideEqualOpportunities || isLastStep}
      accumulatedFiles={accumulatedFiles}
      setAccumulatedFiles={setAccumulatedFiles}
      fData={fData}
      updateData={updateData}
      deletedPendingQualifications={deletedPendingQualifications}
      deletedQualifications={deletedQualifications}
      deletedWorkExperiences={deletedWorkExperiences}
    />,
    ].filter(Boolean)

    return allSteps;
  }

  const forms = getFormSteps();

  return (
    <div className="h-full w-full pt-12 flex flex-col">
      <FormHeader currentStepIndex={currentStepIndex} hideEqualOpportunities={hideEqualOpportunities} />

      <main className="flex flex-1 mt-[50px]">{forms[currentStepIndex]}</main>
    </div>
  );
};
