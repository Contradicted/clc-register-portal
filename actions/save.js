'use server'

import { getSavedApplicationByUserID } from '@/data/application'
import { getCourseByName } from '@/data/courses'
import { getUserById } from '@/data/user'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateApplicationID } from '@/lib/utils'
import { UTApi, UTFile } from "uploadthing/server";

const handleSavePaymentPlan = async (applicationID, values) => {
  console.log(values);

  if (values.tuitionFees === "Student Loan Company England (SLC)") {
    const paymentPlanData = {
      paymentOption: "SLC",
      hasSlcAccount: values.hasSlcAccount ? values.hasSlcAccount === "Yes" : null,
      previouslyReceivedFunds: values.previouslyReceivedFunds ? values.previouslyReceivedFunds === "Yes" : null,
      previousFundingYear: values.previousFundingYear || null,
      appliedForCourse: values.appliedForCourse === "Yes",
      crn: values.crn || null,
      slcStatus: values.slcStatus || null,
      tuitionFeeAmount: values.tuitionFeeAmount
        ? Number(values.tuitionFeeAmount)
        : null,
      maintenanceLoanAmount: values.maintenanceLoanAmount
        ? Number(values.maintenanceLoanAmount)
        : null,
      ssn: values.ssn || null,
      usingMaintenanceForTuition: values.usingMaintenanceForTuition || null,
      courseFee: values.courseFee ? Number(values.courseFee) : null,
      paymentStatus: values.paymentStatus || null,
      shortfall: values.shortfall || null,
      expectedPayments: values.expectedPayments || [],
    };

    const existingPlan = await db.savedPaymentPlan.findUnique({
      where: { applicationID },
    });

    if (existingPlan) {
      // Update existing plan and its payments
      await db.savedPaymentPlan.update({
        where: { applicationID },
        data: {
          ...paymentPlanData,
        },
      });
    } else {
      // Create new plan with payments
      await db.savedPaymentPlan.create({
        data: {
          ...paymentPlanData,
          applicationID,
        },
      });
    }
  } else {
    // If not SLC, delete any existing payment plan
    const existingPlan = await db.savedPaymentPlan.findUnique({
      where: { applicationID },
    });

    if (existingPlan) {
      await db.savedPaymentPlan.delete({
        where: { applicationID },
      });

      const application = await db.savedApplication.findUnique({
        where: { id: applicationID },
      });

      if (application?.tuition_doc_url) {
        const utapi = new UTApi();
        const fileKey = application.tuition_doc_url.split("f/");
        await utapi.deleteFiles(fileKey);

        // Update application to remove document references
        await db.savedApplication.update({
          where: { id: applicationID },
          data: {
            tuition_doc_url: null,
            tuition_doc_name: null,
          },
        });
      }
    }
  }
};

export const save = async (
  values,
  deletedQualifications,
  deletedPendingQualifications,
  deletedWorkExperiences,
  photo
) => {
  const utapi = new UTApi();
  const user = await currentUser();
  const uploadedFiles = await utapi.listFiles();
  const parsedValues = JSON.parse(values);
  const existingUser = await getUserById(user.id);
  const file = photo.get("file");
  const fileExists = photo.get("file_alreadyExists") === "true";
  const isFileRemoved = photo.get("isFileRemoved") === "true";
  const idFile = photo.get("idFile");
  const idFileExists = photo.get("idFile_alreadyExists") === "true";
  const isIdFileRemoved = photo.get("idFile_isRemoved") === "true";
  const immigrationFile = photo.get("immigrationFile");
  const immigrationFileExists =
    photo.get("immigrationFile_alreadyExists") === "true";
  const isImmigrationFileRemoved =
    photo.get("immigrationFile_isRemoved") === "true";

  if (!existingUser) return { error: "User doesn't exist" };

  const userDetails = {
    firstName: parsedValues.firstName,
    lastName: parsedValues.lastName,
    dateOfBirth: parsedValues.dateOfBirth,
    gender: parsedValues.gender,
    addressLine1: parsedValues.addressLine1,
    addressLine2: parsedValues.addressLine2,
    city: parsedValues.city,
    postcode: parsedValues.postcode,
    homeTelephoneNo: parsedValues.homeTelephoneNo,
  };

  const {
    qualifications,
    pendingQualifications,
    isEnglishFirstLanguage,
    addPendingQualifications: hasPendingResults,
    workExperience,
    signature,
    addWorkExperience: hasWorkExperience,
    hasSlcAccount,
    previousFundingYear,
    previouslyReceivedFunds,
    appliedForCourse,
    crn,
    slcStatus,
    paymentOption,
    tuitionFeeAmount,
    maintenanceLoanAmount,
    ssn,
    usingMaintenanceForTuition,
    expectedPayments,
    shortfall,
    paymentStatus,
    courseFee,
    hideEqualOpportunities,
    ...applicationValues
  } = parsedValues;

  // console.log(
  //   "workExperience",
  //   workExperience,
  //   "workExperienceLength",
  //   workExperience.length,
  //   "hasWorkExperience",
  //   hasWorkExperience,
  //   "validWorkExperience",
  //   workExperience.some((we, index) => {
  //     const fileIndex = `work_experience_file_${index}`;
  //     const file = photo.get(fileIndex);

  //     return (
  //       we.title ||
  //       we.nameOfOrganisation ||
  //       we.natureOfJob ||
  //       we.jobStartDate ||
  //       we.jobEndDate ||
  //       (file && file !== "null")
  //     );
  //   })
  // );

  // Check if course exists
  if (
    parsedValues.hasOwnProperty("courseTitle") &&
    parsedValues.hasOwnProperty("studyMode")
  ) {
    const existingCourse = await getCourseByName(parsedValues.courseTitle);

    if (existingCourse) {
      applicationValues.courseID = existingCourse.id;
    } else {
      return { error: "Course not found" };
    }
  } else {
    applicationValues.courseID = null;
  }

  if (parsedValues.hasOwnProperty("isEnglishFirstLanguage")) {
    applicationValues.isEnglishFirstLanguage =
      parsedValues.isEnglishFirstLanguage === "Yes";
  }

  if (hasPendingResults !== undefined) {
    applicationValues.hasPendingResults =
      hasPendingResults === "Yes"
        ? true
        : hasPendingResults === "No"
        ? false
        : null;
  }

  if (hasWorkExperience !== undefined) {
    applicationValues.hasWorkExperience =
      hasWorkExperience === "Yes"
        ? true
        : hasWorkExperience === "No"
        ? false
        : null;
  }

  const existingSavedApplication = await getSavedApplicationByUserID(user.id);

  if (existingSavedApplication) {
    await db.savedApplication.update({
      where: {
        id: existingSavedApplication.id,
      },
      data: {
        ...applicationValues,
        recruitment_agent: applicationValues.recruitment_agent,
      },
    });

    if (userDetails) {
      await db.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          ...userDetails,
        },
      });
    }

    // Handle photo file
    if (file && file !== "null" && !fileExists) {
      const existingFile = uploadedFiles.files.some(
        (uploadedFile) => uploadedFile.name === file.name
      );

      if (!existingFile) {
        if (existingSavedApplication.photoUrl) {
          const fileKey = existingSavedApplication.photoUrl.split("f/");
          await utapi.deleteFiles(fileKey);
        }
        const uploadedFile = await utapi.uploadFiles(file);
        await db.savedApplication.update({
          where: {
            id: existingSavedApplication.id,
          },
          data: {
            photoUrl: uploadedFile.data.url,
            photoName: file.name,
          },
        });
      }
    } else if (file === "null" || !file || isFileRemoved) {
      if (existingSavedApplication.photoUrl) {
        const fileKey = existingSavedApplication.photoUrl.split("f/");
        await utapi.deleteFiles(fileKey);
      }
      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          photoUrl: null,
          photoName: null,
        },
      });
    }

    // Handle identification file
    if (idFile && idFile !== "null" && !idFileExists) {
      if (existingSavedApplication.identificationNoUrl) {
        const idFileKey =
          existingSavedApplication.identificationNoUrl.split("f/");
        await utapi.deleteFiles(idFileKey);
      }
      const uploadedIdFile = await utapi.uploadFiles(idFile);
      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          identificationNoUrl: uploadedIdFile.data.url,
        },
      });
    } else if (idFile === "null" || !idFile || isIdFileRemoved) {
      if (existingSavedApplication.identificationNoUrl) {
        const idFileKey =
          existingSavedApplication.identificationNoUrl.split("f/");
        await utapi.deleteFiles(idFileKey);
      }
      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          identificationNoUrl: null,
        },
      });
    }

    // Handle immigration file
    if (
      immigrationFile &&
      immigrationFile !== "null" &&
      !immigrationFileExists
    ) {
      if (existingSavedApplication.immigration_url) {
        const immigrationFileKey =
          existingSavedApplication.immigration_url.split("f/");
        await utapi.deleteFiles(immigrationFileKey);
      }
      const uploadedImmigrationFile = await utapi.uploadFiles(immigrationFile);
      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          immigration_url: uploadedImmigrationFile.data.url,
          immigration_name: uploadedImmigrationFile.data.name,
        },
      });
    } else if (
      immigrationFile === "null" ||
      !immigrationFile ||
      isImmigrationFileRemoved
    ) {
      if (existingSavedApplication.immigration_url) {
        const immigrationFileKey =
          existingSavedApplication.immigration_url.split("f/");
        await utapi.deleteFiles(immigrationFileKey);
      }
      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          immigration_url: null,
          immigration_name: null,
        },
      });
    }

    // Handle tuition document upload
    const tuitionDoc = photo.get("tuitionDoc");
    const tuitionDocExists = photo.get("tuitionDoc_alreadyExists") === "true";
    const isTuitionDocRemoved = photo.get("tuitionDoc_isRemoved") === "true";

    let tuitionDocUrl = null;
    let tuitionDocName = null;

    if (tuitionDoc && tuitionDoc !== "null" && !tuitionDocExists) {
      if (existingSavedApplication?.tuition_doc_url) {
        const fileKey = existingSavedApplication.tuition_doc_url.split("f/");
        await utapi.deleteFiles(fileKey);
      }
      const uploadedFile = await utapi.uploadFiles(tuitionDoc);
      tuitionDocUrl = uploadedFile.data.url;
      tuitionDocName = tuitionDoc.name;

      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          tuition_doc_url: tuitionDocUrl,
          tuition_doc_name: tuitionDocName,
        },
      });
    } else if (tuitionDoc === "null" || !tuitionDoc || isTuitionDocRemoved) {
      if (existingSavedApplication?.tuition_doc_url) {
        const fileKey = existingSavedApplication.tuition_doc_url.split("f/");
        await utapi.deleteFiles(fileKey);
      }

      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          tuition_doc_url: null,
          tuition_doc_name: null,
        },
      });
    }

    await handleSavePaymentPlan(existingSavedApplication.id, parsedValues);

    if (deletedQualifications.length > 0) {
      // Handle deleting qualifications
      const qualificationsToDelete = await db.savedQualification.findMany({
        where: {
          id: { in: deletedQualifications },
        },
      });

      for (const qual of qualificationsToDelete) {
        if (qual.url) {
          const fileKey = qual.url.split("f/");
          await utapi.deleteFiles(fileKey);
        }
      }

      await db.savedQualification.deleteMany({
        where: {
          id: { in: deletedQualifications },
        },
      });
    }

    // Handle qualifications
    if (qualifications && qualifications.length > 0) {
      const validQualifications = qualifications.filter((qual, index) => {
        const fileIndex = `qualification_file_${index}`;
        const file = photo.get(fileIndex);

        return (
          qual.title ||
          qual.examiningBody ||
          qual.dateAwarded ||
          (file && file !== "null")
        );
      });

      if (validQualifications.length > 0) {
        for (let i = 0; i < validQualifications.length; i++) {
          const qual = validQualifications[i];
          const fileIndex = `qualification_file_${i}`;
          const fileUrl = photo.get(fileIndex);
          const isFileRemoved = photo.get(`${fileIndex}_isRemoved`) === "true";
          const fileExists = photo.get(`${fileIndex}_alreadyExists`) === "true";

          if (qual.id) {
            // Updating existing qualification
            const existingQualification =
              await db.savedQualification.findUnique({
                where: { id: qual.id },
              });

            if (existingQualification) {
              let updateData = {
                title: qual.title,
                examiningBody: qual.examiningBody,
                dateAwarded: qual.dateAwarded,
              };

              // Handle file update or removal
              if (isFileRemoved) {
                // Remove existing file
                if (existingQualification.url) {
                  const fileKey = existingQualification.url.split("f/")[1];
                  await utapi.deleteFiles([fileKey]);
                }
                updateData.url = null;
                updateData.fileName = null;
              } else if (fileUrl && fileUrl !== "null" && !fileExists) {
                // Upload new file
                const uploadedFile = await utapi.uploadFiles(fileUrl);
                // Remove old file if it exists
                if (existingQualification.url) {
                  const fileKey = existingQualification.url.split("f/")[1];
                  await utapi.deleteFiles([fileKey]);
                }
                updateData.url = uploadedFile.data.url;
                updateData.fileName = uploadedFile.data.name;
              }

              // Update the qualification
              await db.savedQualification.update({
                where: { id: qual.id },
                data: updateData,
              });
            }
          } else {
            // Creating new qualification
            let createData = {
              title: qual.title,
              examiningBody: qual.examiningBody,
              dateAwarded: qual.dateAwarded,
              applicationID: existingSavedApplication.id,
            };

            if (fileUrl && fileUrl !== "null") {
              const uploadedFile = await utapi.uploadFiles(fileUrl);
              createData.url = uploadedFile.data.url;
              createData.fileName = uploadedFile.data.name;
            }

            await db.savedQualification.create({ data: createData });
          }
        }
      }
    }

    // Handle deleting pending qualifications
    if (deletedPendingQualifications.length > 0 && hasPendingResults !== "No") {
      await db.savedPendingQualification.deleteMany({
        where: {
          id: { in: deletedPendingQualifications },
        },
      });
    }

    if (hasPendingResults === "No") {
      const existingPendingQualifications =
        await db.savedPendingQualification.findMany({
          where: {
            applicationID: existingSavedApplication.id,
          },
        });

      if (existingPendingQualifications) {
        await db.savedPendingQualification.deleteMany({
          where: {
            applicationID: existingSavedApplication.id,
          },
        });
      }
    }

    // Handle pending qualifications
    if (applicationValues.hasPendingResults) {
      const validPendingQualifications = pendingQualifications.filter(
        (qual, index) => {
          return (
            qual.title ||
            qual.examiningBody ||
            qual.dateOfResults ||
            qual.subjectsPassed
          );
        }
      );

      if (validPendingQualifications.length > 0) {
        for (let i = 0; i < validPendingQualifications.length; i++) {
          const qual = validPendingQualifications[i];

          if (qual.id) {
            await db.savedPendingQualification.update({
              where: {
                id: qual.id,
              },
              data: {
                title: qual.title,
                examiningBody: qual.examiningBody,
                dateOfResults: qual.dateOfResults,
                subjectsPassed: qual.subjectsPassed,
              },
            });
          } else {
            await db.savedPendingQualification.create({
              data: {
                title: qual.title,
                examiningBody: qual.examiningBody,
                dateOfResults: qual.dateOfResults,
                subjectsPassed: qual.subjectsPassed,
                applicationID: existingSavedApplication.id,
              },
            });
          }
        }
      }
    }

    // Handle deleting work experiences
    if (deletedWorkExperiences.length > 0) {
      const workExperiencesToDelete = await db.savedWorkExperience.findMany({
        where: {
          id: { in: deletedWorkExperiences },
        },
      });

      for (const we of workExperiencesToDelete) {
        if (we.url) {
          const fileKey = we.url.split("f/");
          await utapi.deleteFiles(fileKey);
        }
      }

      await db.savedWorkExperience.deleteMany({
        where: {
          id: { in: deletedWorkExperiences },
        },
      });
    }

    if (hasWorkExperience === "No") {
      const existingWorkExperiences = await db.savedWorkExperience.findMany({
        where: {
          applicationID: existingSavedApplication.id,
        },
      });

      for (const we of existingWorkExperiences) {
        if (we.url) {
          const fileKey = we.url.split("f/");
          await utapi.deleteFiles(fileKey);
        }
      }

      if (existingWorkExperiences) {
        await db.savedWorkExperience.deleteMany({
          where: {
            applicationID: existingSavedApplication.id,
          },
        });
      }
    }

    // Handle work experiences
    if (applicationValues.hasWorkExperience) {
      const validWorkExperiences = workExperience.filter((we, index) => {
        const fileIndex = `work_experience_file_${index}`;
        const file = photo.get(fileIndex);

        return (
          we.title ||
          we.nameOfOrganisation ||
          we.natureOfJob ||
          we.jobStartDate ||
          we.jobEndDate ||
          (file && file !== "null")
        );
      });

      if (
        applicationValues.hasWorkExperience &&
        validWorkExperiences.length > 0
      ) {
        for (let i = 0; i < validWorkExperiences.length; i++) {
          const we = validWorkExperiences[i];
          const fileIndex = `work_experience_file_${i}`;
          const isFileAlreadyExists =
            photo.get(`${fileIndex}_alreadyExists`) === "true";
          const isFileRemoved = photo.get(`${fileIndex}_isRemoved`) === "true";
          const fileUrl = photo.get(fileIndex);

          try {
            if (we.id) {
              // Update existing work experience
              const existingWorkExperience =
                await db.savedWorkExperience.findUnique({
                  where: { id: we.id },
                });

              if (existingWorkExperience) {
                let updateData = {
                  title: we.title,
                  nameOfOrganisation: we.nameOfOrganisation,
                  natureOfJob: we.natureOfJob,
                  jobStartDate: we.jobStartDate,
                  jobEndDate: we.jobEndDate,
                };

                if (isFileRemoved) {
                  if (existingWorkExperience.url) {
                    const fileKey = existingWorkExperience.url.split("f/")[1];
                    await utapi.deleteFiles([fileKey]);
                  }
                  updateData.url = null;
                  updateData.fileName = null;
                } else if (
                  fileUrl &&
                  fileUrl !== "null" &&
                  !isFileAlreadyExists
                ) {
                  if (existingWorkExperience.url) {
                    const fileKey = existingWorkExperience.url.split("f/")[1];
                    await utapi.deleteFiles([fileKey]);
                  }
                  const uploadedFile = await utapi.uploadFiles(fileUrl);
                  updateData.url = uploadedFile.data.url;
                  updateData.fileName = uploadedFile.data.name;
                }

                await db.savedWorkExperience.update({
                  where: { id: we.id },
                  data: updateData,
                });
              }
            } else {
              // Create new work experience
              let createData = {
                title: we.title || null,
                nameOfOrganisation: we.nameOfOrganisation || null,
                natureOfJob: we.natureOfJob || null,
                jobStartDate: we.jobStartDate || null,
                jobEndDate: we.jobEndDate || null,
                applicationID: existingSavedApplication.id,
              };

              if (fileUrl && fileUrl !== "null") {
                const uploadedFile = await utapi.uploadFiles(fileUrl);
                createData.url = uploadedFile.data.url;
                createData.fileName = uploadedFile.data.name;
              }

              await db.savedWorkExperience.create({ data: createData });
            }
          } catch (error) {
            console.error(`Error processing work experience ${i}:`, error);
          }
        }
      }
    }

    let signatureUrl = null;

    // Handle signature
    if (signature) {
      const existingSignature = existingSavedApplication.signatureUrl;

      if (existingSignature) {
        const fileKey = existingSignature.split("f/");
        await utapi.deleteFiles(fileKey);
      }

      const signatureBlob = await fetch(signature).then((res) => res.blob());

      const file = new UTFile(
        [signatureBlob],
        `${existingSavedApplication.id}-signature.png`
      );

      const uploadedSignature = await utapi.uploadFiles([file]);
      signatureUrl = uploadedSignature[0].data.url;

      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          signatureUrl,
        },
      });
    } else {
      if (existingSavedApplication.signatureUrl) {
        const fileKey = existingSavedApplication.signatureUrl.split("f/");
        await utapi.deleteFiles(fileKey);
      }

      await db.savedApplication.update({
        where: {
          id: existingSavedApplication.id,
        },
        data: {
          signatureUrl: null,
        },
      });
    }

    return { success: "Successfully saved application!" };
  }

  // Creating saved application for first time
  const applicationID = generateApplicationID();

  if (userDetails) {
    await db.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        ...userDetails,
      },
    });
  }

  const uploadedPhotoFile =
    file && file !== "null" ? await utapi.uploadFiles(file) : null;
  const uploadedIdFile =
    idFile && idFile !== "null" ? await utapi.uploadFiles(idFile) : null;
  const uploadedImmigrationFile =
    immigrationFile && immigrationFile !== "null"
      ? await utapi.uploadFiles(immigrationFile)
      : null;

  // Handle tuition document upload
  const tuitionDoc = photo.get("tuitionDoc");
  const tuitionDocExists = photo.get("tuitionDoc_alreadyExists") === "true";
  const isTuitionDocRemoved = photo.get("tuitionDoc_isRemoved") === "true";

  let tuitionDocUrl = null;
  let tuitionDocName = null;

  if (tuitionDoc && tuitionDoc !== "null" && !tuitionDocExists) {
    if (existingSavedApplication?.tuition_doc_url) {
      const fileKey = existingSavedApplication.tuition_doc_url.split("f/");
      await utapi.deleteFiles(fileKey);
    }
    const uploadedFile = await utapi.uploadFiles(tuitionDoc);
    tuitionDocUrl = uploadedFile.data.url;
    tuitionDocName = tuitionDoc.name;
  } else if (tuitionDoc === "null" || !tuitionDoc || isTuitionDocRemoved) {
    if (existingSavedApplication?.tuition_doc_url) {
      const fileKey = existingSavedApplication.tuition_doc_url.split("f/");
      await utapi.deleteFiles(fileKey);
    }
  }

  await db.savedApplication.create({
    data: {
      id: applicationID,
      userID: existingUser.id,
      ...applicationValues,
      photoName: uploadedPhotoFile ? file.name : null,
      photoUrl: uploadedPhotoFile ? uploadedPhotoFile.data.url : null,
      identificationNoUrl: uploadedIdFile ? uploadedIdFile.data.url : null,
      immigration_url: uploadedImmigrationFile
        ? uploadedImmigrationFile.data.url
        : null,
      immigration_name: uploadedImmigrationFile
        ? uploadedImmigrationFile.data.name
        : null,
      tuition_doc_url: tuitionDocUrl,
      tuition_doc_name: tuitionDocName,
      recruitment_agent: applicationValues.recruitment_agent,
    },
  });

  await handleSavePaymentPlan(applicationID, parsedValues);

  if (qualifications) {
    for (let i = 0; i < qualifications.length; i++) {
      const qual = qualifications[i];
      const fileKey = `qualification_file_${i}`;
      const file = photo.get(fileKey);

      let fileUrl = null;
      let fileName = null;

      if (file && file !== "null") {
        const uploadedFile = await utapi.uploadFiles(file);
        fileUrl = uploadedFile.data.url;
        fileName = file.name;
      }

      await db.savedQualification.create({
        data: {
          title: qual.title,
          examiningBody: qual.examiningBody,
          dateAwarded: qual.dateAwarded,
          applicationID,
          url: fileUrl,
          fileName,
        },
      });
    }
  }

  // Handle pending qualifications
  if (pendingQualifications) {
    for (let i = 0; i < pendingQualifications.length; i++) {
      const qual = pendingQualifications[i];

      await db.savedPendingQualification.create({
        data: {
          title: qual.title,
          examiningBody: qual.examiningBody,
          dateOfResults: qual.dateOfResults,
          subjectsPassed: qual.subjectsPassed,
          applicationID,
        },
      });
    }
  }

  // Handle work experiences
  if (workExperience) {
    for (let i = 0; i < workExperience.length; i++) {
      const we = workExperience[i];
      const fileKey = `work_experience_file_${i}`;
      const file = photo.get(fileKey);

      let fileUrl = null;
      let fileName = null;

      if (file && file !== "null") {
        const uploadedFile = await utapi.uploadFiles(file);
        fileUrl = uploadedFile.data.url;
        fileName = file.name;
      }

      await db.savedWorkExperience.create({
        data: {
          title: we.title,
          nameOfOrganisation: we.nameOfOrganisation,
          natureOfJob: we.natureOfJob,
          jobStartDate: we.jobStartDate,
          jobEndDate: we.jobEndDate,
          applicationID,
          url: fileUrl,
          fileName,
        },
      });
    }
  }

  let signatureUrl = null;

  if (signature) {
    const signatureBlob = await fetch(signature).then((res) => res.blob());

    const file = new UTFile(
      [signatureBlob],
      `${applicationID.id}-signature.png`
    );
    const uploadedSignature = await utapi.uploadFiles([file]);
    signatureUrl = uploadedSignature[0].data.url;

    await db.savedApplication.update({
      where: {
        id: applicationID,
      },
      data: {
        signatureUrl,
      },
    });
  }

  return { success: "Successfully saved application!" };
};
