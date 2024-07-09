"use server";

import { getSavedApplicationByUserID } from "@/data/application";
import { getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateApplicationID } from "@/lib/utils";
import { UTApi } from "uploadthing/server";

export const submit = async (
  values,
  deletedQualifications,
  deletedWorkExperiences,
  photo
) => {
  const utapi = new UTApi();
  const user = await currentUser();
  const uploadedFiles = await utapi.listFiles();
  const existingSavedApplication = await getSavedApplicationByUserID(user.id);
  const existingUser = await getUserById(user.id);

  const parsedValues = JSON.parse(values);
  const file = photo.get("file");
  const fileExists = photo.get("file_alreadyExists") === "true";
  const isFileRemoved = photo.get("isFileRemoved") === "true";
  const idFile = photo.get("idFile");
  const idFileExists = photo.get("idFile_alreadyExists") === "true";
  const isIdFileRemoved = photo.get("idFile_isRemoved") === "true";

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
    workExperience,
    isEnglishFirstLanguage,
    addWorkExperience: hasWorkExperience,
    addPendingQualifications: hasPendingResults,
    ...applicationValues
  } = parsedValues;

  applicationValues.isEnglishFirstLanguage = isEnglishFirstLanguage === "Yes";
  applicationValues.hasPendingResults = hasPendingResults === "Yes";
  applicationValues.hasWorkExperience = hasWorkExperience === "Yes";

  if (!existingSavedApplication) {
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

    const applicationID = generateApplicationID();

    await db.application.create({
      data: {
        id: applicationID,
        userID: user.id,
        ...applicationValues,
        photoName: uploadedPhotoFile ? file.name : null,
        photoUrl: uploadedPhotoFile ? uploadedPhotoFile.data.url : null,
        identificationNoUrl: uploadedIdFile ? uploadedIdFile.data.url : null,
      },
    });

    if (qualifications) {
      for (let i = 0; i < qualifications.length; i++) {
        const qual = qualifications[i];
        const fileIndex = `qualification_file_${i}`;
        const fileUrl = photo.get(fileIndex);

        let url = null;
        let name = null;

        if (fileUrl && fileUrl !== "null") {
          const uploadedFile = await utapi.uploadFiles(fileUrl);
          url = uploadedFile.data.url;
          name = fileUrl.name;
        }

        await db.qualification.create({
          data: {
            title: qual.title,
            examiningBody: qual.examiningBody,
            dateAwarded: qual.dateAwarded,
            applicationID,
            fileName: name,
            url,
          },
        });
      }
    }

    if (pendingQualifications) {
      for (let i = 0; i < pendingQualifications.length; i++) {
        const qual = pendingQualifications[i];
        await db.pendingQualification.create({
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

        await db.workExperience.create({
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

    return { success: "Successfully submitted application!" };
  }

  if (existingSavedApplication) {
    let uploadedPhotoFile;
    let uploadedPhotoFileUrl;
    let uploadedIDFile;

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

    const applicationID = generateApplicationID();

    // Handle Profile Picture File
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
        uploadedPhotoFile = uploadedFile.data.name;
        uploadedPhotoFileUrl = uploadedFile.data.url;
      }
    } else if (file === "null" || !file || isFileRemoved) {
      if (existingSavedApplication.photoUrl) {
        const fileKey = existingSavedApplication.photoUrl.split("f/");
        await utapi.deleteFiles(fileKey);
      }
      uploadedPhotoFile = null;
    } else {
      if (fileExists) {
        if (existingSavedApplication.photoUrl) {
          uploadedPhotoFile = existingSavedApplication?.photoName;
          uploadedPhotoFileUrl = existingSavedApplication?.photoUrl;
        }
      }
    }

    // Handle Identification/Passport File
    if (idFile && idFile !== "null" && !idFileExists) {
      const existingIdFile = uploadedFiles.files.some(
        (uploadedFile) => uploadedFile.name === idFile.name
      );

      if (!existingIdFile) {
        if (existingSavedApplication.identificationNoUrl) {
          const idFileKey =
            existingSavedApplication.identificationFileUrl.split("f/");
          await utapi.deleteFiles(idFileKey);
        }
        const uploadedID = await utapi.uploadFiles(idFile);
        uploadedIDFile = uploadedID.data.url;
      }
    } else if (idFile === "null" || !idFile || isIdFileRemoved) {
      if (existingSavedApplication.identificationNoUrl) {
        const idFileKey =
          existingSavedApplication.identificationNoUrl.split("f/");
        await utapi.deleteFiles(idFileKey);
      }
      uploadedIDFile = null;
    } else {
      if (idFileExists) {
        if (existingSavedApplication.identificationNoUrl) {
          uploadedIDFile = existingSavedApplication?.identificationNoUrl;
        }
      }
    }

    // Create application
    await db.application.create({
      data: {
        id: applicationID,
        userID: user.id,
        photoName: uploadedPhotoFile || null,
        photoUrl: uploadedPhotoFileUrl || null,
        identificationNoUrl: uploadedIDFile || null,
        ...applicationValues,
      },
    });

    // Handle deleting qualifications
    if (deletedQualifications.length > 0) {
      const qualificationsToDelete = await db.savedQualification.findMany({
        where: {
          id: { in: deletedQualifications },
        },
      });

      for (const qual of qualificationsToDelete) {
        if (qual.fileUrl) {
          const fileKey = qual.fileUrl.split("f/");
          await utapi.deleteFiles(fileKey);
        }
      }
    }

    if (qualifications) {
      // Qualifications
      for (let i = 0; i < qualifications.length; i++) {
        const qual = qualifications[i];
        const fileIndex = `qualification_file_${i}`;
        const fileUrl = photo.get(fileIndex);

        if (qual.id) {
          const existingQualification = await db.savedQualification.findUnique({
            where: {
              id: qual.id,
            },
          });

          if (existingQualification) {
            if (fileUrl === "null") {
              if (existingQualification.photoUrl) {
                const fileKey = existingQualification.fileUrl.split("f/");
                await utapi.deleteFiles(fileKey);
              }
            } else if (
              fileUrl &&
              fileUrl !== "null" &&
              !(typeof fileUrl === "string")
            ) {
              const uploadedFile = await utapi.uploadFiles(fileUrl);
              if (existingQualification.fileUrl) {
                const fileKey = existingQualification.fileUrl.split("f/");
                await utapi.deleteFiles(fileKey);
              }

              await db.qualification.create({
                data: {
                  applicationID,
                  title: qual.title,
                  examiningBody: qual.examiningBody,
                  dateAwarded: qual.dateAwarded,
                  url: uploadedFile.data.url,
                  fileName: uploadedFile.data.name,
                },
              });
            } else {
              await db.qualification.create({
                data: {
                  applicationID,
                  title: qual.title,
                  examiningBody: qual.examiningBody,
                  dateAwarded: qual.dateAwarded,
                  fileName: existingQualification?.fileName,
                  url: existingQualification?.fileUrl,
                },
              });
            }

            await db.savedQualification.delete({
              where: {
                id: qual.id,
              },
            });
          }
        } else {
          let url = null;
          let name = null;

          if (fileUrl && fileUrl !== "null") {
            const uploadedFile = await utapi.uploadFiles(fileUrl);
            url = uploadedFile.data.url;
            name = fileUrl.name;
          }

          await db.qualification.create({
            data: {
              title: qual.title,
              examiningBody: qual.examiningBody,
              dateAwarded: qual.dateAwarded,
              applicationID,
              fileName: name,
              url,
            },
          });
        }
      }
    }

    if (pendingQualifications) {
      for (let i = 0; i < pendingQualifications.length; i++) {
        const qual = pendingQualifications[i];

        if (qual.id) {
          await db.savedPendingQualification.delete({
            where: {
              id: qual.id,
            },
          });

          await db.pendingQualification.create({
            data: {
              applicationID,
              title: qual.title,
              examiningBody: qual.examiningBody,
              dateOfResults: qual.dateOfResults,
              subjectsPassed: qual.subjectsPassed,
            },
          });
        } else {
          await db.pendingQualification.create({
            data: {
              applicationID,
              title: qual.title,
              examiningBody: qual.examiningBody,
              dateOfResults: qual.dateOfResults,
              subjectsPassed: qual.subjectsPassed,
            },
          });
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
        if (we.fileUrl) {
          const fileKey = we.fileUrl.split("f/");
          await utapi.deleteFiles(fileKey);
        }
      }
    }

    if (hasWorkExperience === "No") {
      const existingWorkExperiences = await db.savedWorkExperience.findMany({
        where: {
          applicationID: existingSavedApplication.id,
        },
      });

      for (const we of existingWorkExperiences) {
        if (we.fileUrl) {
          const fileKey = we.fileUrl.split("f/");
          await utapi.deleteFiles(fileKey);
        }
      }
    }

    if (workExperience) {
      for (let i = 0; i < workExperience.length; i++) {
        const we = workExperience[i];
        const fileIndex = `work_experience_file_${i}`;
        const fileUrl = photo.get(fileIndex);

        if (we.id) {
          const existingWorkExperience =
            await db.savedWorkExperience.findUnique({
              where: {
                id: we.id,
              },
            });

          if (existingWorkExperience) {
            if (fileUrl === "null") {
              if (existingWorkExperience.fileUrl) {
                const fileKey = existingWorkExperience.fileUrl.split("f/");
                await utapi.deleteFiles(fileKey);
              }
            } else if (
              fileUrl &&
              fileUrl !== "null" &&
              !(typeof fileUrl === "string")
            ) {
              const uploadedFile = await utapi.uploadFiles(fileUrl);
              if (existingWorkExperience.fileUrl) {
                const fileKey = existingWorkExperience.fileUrl.split("f/");
                await utapi.deleteFiles(fileKey);
              }

              await db.workExperience.create({
                data: {
                  applicationID,
                  title: we.title,
                  nameOfOrganisation: we.nameOfOrganisation,
                  natureOfJob: we.natureOfJob,
                  jobStartDate: we.jobStartDate,
                  jobEndDate: we.jobEndDate,
                  url: uploadedFile.data.url,
                  fileName: uploadedFile.data.name,
                },
              });
            } else {
              await db.workExperience.create({
                data: {
                  applicationID,
                  title: we.title,
                  nameOfOrganisation: we.nameOfOrganisation,
                  natureOfJob: we.natureOfJob,
                  jobStartDate: we.jobStartDate,
                  jobEndDate: we.jobEndDate,
                  url: existingWorkExperience?.fileUrl,
                  fileName: existingWorkExperience?.fileName,
                },
              });
            }

            await db.savedWorkExperience.delete({
              where: {
                id: we.id,
              },
            });
          }
        } else {
          let url = null;
          let name = null;

          if (fileUrl && fileUrl !== "null") {
            const uploadedFile = await utapi.uploadFiles(fileUrl);
            url = uploadedFile.data.url;
            name = fileUrl.name;
          }

          await db.workExperience.create({
            data: {
              title: we.title,
              nameOfOrganisation: we.nameOfOrganisation,
              natureOfJob: we.natureOfJob,
              jobStartDate: we.jobStartDate,
              jobEndDate: we.jobEndDate,
              applicationID,
              fileName: name,
              url,
            },
          });
        }
      }
    }

    // Delete Saved Application
    await db.savedApplication.delete({
      where: {
        id: existingSavedApplication.id,
      },
    });

    return { success: "Successfully submitted application!" };
  }
};
