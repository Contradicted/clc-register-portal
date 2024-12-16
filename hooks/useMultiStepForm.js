"use client";

import { useState } from "react";

export const useMultiStepForm = (steps, initialData) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [applicationData, setApplicationData] = useState(initialData);
  const [fData, setFData] = useState({});
  const [accumulatedFiles, setAccumulatedFiles] = useState({});
  const [deletedQualifications, setDeletedQualifications] = useState([]);
  const [deletedWorkExperiences, setDeletedWorkExperiences] = useState([]);
  const [deletedPendingQualifications, setDeletedPendingQualifications] =
    useState([]);

  // Calculate total steps based on if Equal Opportunities is hidden
  const totalSteps = applicationData?.hideEqualOpportunities ? steps - 1 : steps;

  const updateData = (formData, files) => {
    setApplicationData((prevData) => ({
      ...prevData,
      ...formData,
    }));

    if (files) {
      setAccumulatedFiles((prevFiles) => ({
        ...prevFiles,
        ...files,
      }));
    }

    setFData((prevData) => ({
      ...prevData,
      ...formData,
    }));
  };

  const nextStep = (data, file) => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((i) => i + 1);
    }

    updateData(data, file);
  };

  const previousStep = (data, file) => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }

    updateData(data, file);
  };

  return {
    currentStepIndex,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === totalSteps - 1,
    nextStep,
    applicationData,
    fData,
    updateData,
    deletedQualifications,
    setDeletedQualifications,
    deletedPendingQualifications,
    setDeletedPendingQualifications,
    deletedWorkExperiences,
    setDeletedWorkExperiences,
    accumulatedFiles,
    setAccumulatedFiles,
    previousStep,
    setCurrentStepIndex,
  };
};
