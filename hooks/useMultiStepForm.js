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
    if (currentStepIndex < steps - 1) {
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
    isLastStep: currentStepIndex === steps - 1,
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
