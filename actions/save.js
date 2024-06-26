"use server";

import { getSavedApplicationByUserID } from "@/data/application";
import { getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateApplicationID } from "@/lib/utils";
import { UTApi } from "uploadthing/server";

export const save = async (
  values,
  deletedQualifications,
  deletedPendingQualifications,
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
    ...applicationValues
  } = parsedValues;

  applicationValues.isEnglishFirstLanguage = isEnglishFirstLanguage === "Yes";
  applicationValues.hasPendingResults = hasPendingResults === "Yes";

  const existingSavedApplication = await getSavedApplicationByUserID(user.id);

  if (existingSavedApplication) {
    await db.savedApplication.update({
      where: {
        id: existingSavedApplication.id,
      },
      data: {
        ...applicationValues,
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

      await db.savedQualification.deleteMany({
        where: {
          id: { in: deletedQualifications },
        },
      });
    }

    if (qualifications) {
      for (let i = 0; i < qualifications.length; i++) {
        const qual = qualifications[i];
        const fileIndex = `file_${i}`;
        const fileUrl = photo.get(fileIndex);

        if (qual.id) {
          const existingQualification = await db.savedQualification.findUnique({
            where: { id: qual.id },
          });

          if (existingQualification) {
            if (fileUrl === "null") {
              if (existingQualification.fileUrl) {
                const fileKey = existingQualification.fileUrl.split("f/");
                await utapi.deleteFiles(fileKey);
              }

              await db.savedQualification.update({
                where: {
                  id: qual.id,
                },
                data: {
                  title: qual.title,
                  examiningBody: qual.examiningBody,
                  dateAwarded: qual.dateAwarded,
                  fileUrl: null,
                  fileName: null,
                },
              });
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
              await db.savedQualification.update({
                where: {
                  id: qual.id,
                },
                data: {
                  title: qual.title,
                  examiningBody: qual.examiningBody,
                  dateAwarded: qual.dateAwarded,
                  fileUrl: uploadedFile.data.url,
                  fileName: uploadedFile.data.name,
                },
              });
            } else {
              await db.savedQualification.update({
                where: {
                  id: qual.id,
                },
                data: {
                  title: qual.title,
                  examiningBody: qual.examiningBody,
                  dateAwarded: qual.dateAwarded,
                },
              });
            }
          }
        } else {
          let url = null;
          let name = null;

          if (fileUrl && fileUrl !== "null") {
            const uploadedFile = await utapi.uploadFiles(fileUrl);
            url = uploadedFile.data.url;
            name = fileUrl.name;
          }

          await db.savedQualification.create({
            data: {
              title: qual.title,
              examiningBody: qual.examiningBody,
              dateAwarded: qual.dateAwarded,
              applicationID: existingSavedApplication.id,
              fileName: name,
              fileUrl: url,
            },
          });
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
    if (pendingQualifications) {
      for (let i = 0; i < pendingQualifications.length; i++) {
        const qual = pendingQualifications[i];

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

    return { success: "Successfully saved application!" };
  }

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

  if (file && file !== "null") {
    await utapi.uploadFiles(file).then(async (res) => {
      await db.savedApplication.create({
        data: {
          id: applicationID,
          userID: user.id,
          photoName: file.name,
          photoUrl: res.data.url,
          ...applicationValues,
        },
      });
    });
  }

  if (!file && file === "null") {
    await db.savedApplication.create({
      data: {
        id: applicationID,
        userID: user.id,
        ...applicationValues,
      },
    });
  }

  if (qualifications) {
    for (let i = 0; i < qualifications.length; i++) {
      const qual = qualifications[i];
      const fileKey = `file_${i}`;
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
          fileUrl,
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

  return { success: "Successfully saved application!" };
};
