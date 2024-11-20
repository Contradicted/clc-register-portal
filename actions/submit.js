'use server'

import {
    getApplicationByUserID,
    getSavedApplicationByUserID,
} from '@/data/application'
import { getCourseByName } from '@/data/courses'
import { getUserById } from '@/data/user'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendRecievedApplicationEmail, sendReSubmittedEmail } from '@/lib/mail'
import { generateApplicationID } from '@/lib/utils'
import { UTApi, UTFile } from 'uploadthing/server'

const handleSubmitPaymentPlan = async (applicationID, values) => {
    if (values.tuitionFees === 'Student Loan Company England (SLC)') {
        // First check for existing payment plans
        const [existingSavedPaymentPlan, existingPaymentPlan] =
            await Promise.all([
                db.savedPaymentPlan.findUnique({
                    where: { applicationID },
                }),
                db.paymentPlan.findUnique({
                    where: { applicationID },
                }),
            ])

        // Prepare payment plan data
        const paymentPlanData = existingSavedPaymentPlan
            ? {
                  paymentOption: existingSavedPaymentPlan.paymentOption,
                  hasSlcAccount: existingSavedPaymentPlan.hasSlcAccount,
                  previouslyReceivedFunds:
                      existingSavedPaymentPlan.previouslyReceivedFunds,
                  previousFundingYear:
                      existingSavedPaymentPlan.previousFundingYear,
                  appliedForCourse: existingSavedPaymentPlan.appliedForCourse,
                  crn: existingSavedPaymentPlan.crn,
                  slcStatus: existingSavedPaymentPlan.slcStatus,
                  tuitionFeeAmount: existingSavedPaymentPlan.tuitionFeeAmount,
                  maintenanceLoanAmount:
                      existingSavedPaymentPlan.maintenanceLoanAmount,
                  ssn: existingSavedPaymentPlan.ssn,
                  usingMaintenanceForTuition:
                      existingSavedPaymentPlan.usingMaintenanceForTuition,
                  courseFee: existingSavedPaymentPlan.courseFee,
                  paymentStatus: existingSavedPaymentPlan.paymentStatus,
                  shortfall: existingSavedPaymentPlan.shortfall,
                  expectedPayments: existingSavedPaymentPlan.expectedPayments,
              }
            : {
                  paymentOption: 'SLC',
                  hasSlcAccount: values.hasSlcAccount === 'Yes',
                  previouslyReceivedFunds:
                      values.previouslyReceivedFunds === 'Yes',
                  previousFundingYear: values.previousFundingYear || null,
                  appliedForCourse: values.appliedForCourse === 'Yes',
                  crn: values.crn || null,
                  slcStatus: values.slcStatus || null,
                  tuitionFeeAmount: values.tuitionFeeAmount
                      ? Number(values.tuitionFeeAmount)
                      : null,
                  maintenanceLoanAmount: values.maintenanceLoanAmount
                      ? Number(values.maintenanceLoanAmount)
                      : null,
                  ssn: values.ssn || null,
                  usingMaintenanceForTuition:
                      values.usingMaintenanceForTuition || null,
                  courseFee: values.courseFee ? Number(values.courseFee) : null,
                  paymentStatus: values.paymentStatus || null,
                  shortfall: values.shortfall || null,
                  expectedPayments: values.expectedPayments || [],
              }

        if (existingPaymentPlan) {
            // Update existing payment plan
            await db.paymentPlan.update({
                where: { applicationID },
                data: paymentPlanData,
            })
        } else {
            // Create new payment plan
            await db.paymentPlan.create({
                data: {
                    applicationID,
                    ...paymentPlanData,
                },
            })
        }

        // Delete saved payment plan if it exists
        if (existingSavedPaymentPlan) {
            await db.savedPaymentPlan.delete({
                where: { applicationID },
            })
        }
    } else {
        // If not SLC, then check if payment plans have been created before
        const [application, savedApplication] = await Promise.all([
            db.application.findUnique({
                where: { id: applicationID },
                select: { tuition_doc_url: true },
            }),
            db.savedApplication.findUnique({
                where: { id: applicationID },
                select: { tuition_doc_url: true },
            }),
        ])

        // Delete tuition doc files if they exist
        const deletePromises = []
        const utapi = new UTApi()

        if (application?.tuition_doc_url) {
            const fileKey = application.tuition_doc_url.split('f/')[1]
            deletePromises.push(utapi.deleteFiles([fileKey]))
        }
        if (savedApplication?.tuition_doc_url) {
            const fileKey = savedApplication.tuition_doc_url.split('f/')[1]
            deletePromises.push(utapi.deleteFiles([fileKey]))
        }

        await Promise.all([
            ...deletePromises,
            db.savedPaymentPlan.deleteMany({
                where: { applicationID },
            }),
            db.paymentPlan.deleteMany({
                where: { applicationID },
            }),
            db.application.update({
                where: { id: applicationID },
                data: {
                    tuition_doc_url: null,
                    tuition_doc_name: null,
                },
            }),
            db.savedApplication.update({
                where: { id: applicationID },
                data: {
                    tuition_doc_url: null,
                    tuition_doc_name: null,
                },
            }),
        ])
    }
}

export const submit = async (
    values,
    deletedQualifications,
    deletedWorkExperiences,
    photo
) => {
    const utapi = new UTApi()
    const user = await currentUser()
    const uploadedFiles = await utapi.listFiles()
    const existingApplication = await getApplicationByUserID(user.id)
    const existingSavedApplication = await getSavedApplicationByUserID(user.id)
    const existingUser = await getUserById(user.id)

    const parsedValues = JSON.parse(values)
    const file = photo.get('file')
    const fileExists = photo.get('file_alreadyExists') === 'true'
    const isFileRemoved = photo.get('isFileRemoved') === 'true'
    const idFile = photo.get('idFile')
    const idFileExists = photo.get('idFile_alreadyExists') === 'true'
    const isIdFileRemoved = photo.get('idFile_isRemoved') === 'true'
    const immigrationFile = photo.get('immigrationFile')
    const immigrationFileExists =
        photo.get('immigrationFile_alreadyExists') === 'true'
    const isImmigrationFileRemoved =
        photo.get('immigrationFile_isRemoved') === 'true'

    if (!existingUser) return { error: "User doesn't exist" }

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
    }

    const {
        qualifications,
        pendingQualifications,
        workExperience,
        signature,
        isEnglishFirstLanguage,
        addWorkExperience: hasWorkExperience,
        addPendingQualifications: hasPendingResults,
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
        ...applicationValues
    } = parsedValues

    const existingCourse = await getCourseByName(parsedValues.courseTitle)

    if (!existingCourse) return { error: "Course doesn't exist" }

    applicationValues.isEnglishFirstLanguage = isEnglishFirstLanguage === 'Yes'
    applicationValues.hasPendingResults = hasPendingResults === 'Yes'
    applicationValues.hasWorkExperience = hasWorkExperience === 'Yes'

    // Resubmitting Application
    if (existingApplication && existingApplication.length > 0) {
        let uploadedPhotoFile
        let uploadedPhotoFileUrl
        let uploadedIDFile
        let uploadedImmigrationFileName
        let uploadedImmigrationFileUrl
        let tuitionDocUrl = null
        let tuitionDocName = null

        if (userDetails) {
            await db.user.update({
                where: {
                    id: existingUser.id,
                },
                data: {
                    ...userDetails,
                },
            })
        }

        // Handle Profile Picture File
        if (file && file !== 'null' && !fileExists) {
            const existingFile = uploadedFiles.files.some(
                (uploadedFile) => uploadedFile.name === file.name
            )

            if (!existingFile) {
                if (existingApplication[0].photoUrl) {
                    const fileKey = existingApplication[0].photoUrl.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
                const uploadedFile = await utapi.uploadFiles(file)
                uploadedPhotoFile = uploadedFile.data.name
                uploadedPhotoFileUrl = uploadedFile.data.url
            }
        } else if (file === 'null' || !file || isFileRemoved) {
            if (existingApplication[0].photoUrl) {
                const fileKey = existingApplication[0].photoUrl.split('f/')
                await utapi.deleteFiles(fileKey)
            }
            uploadedPhotoFile = null
        } else {
            if (fileExists) {
                if (existingApplication[0].photoUrl) {
                    uploadedPhotoFile = existingApplication[0]?.photoName
                    uploadedPhotoFileUrl = existingApplication[0]?.photoUrl
                }
            }
        }

        // Handle Identification/Passport File
        if (idFile && idFile !== 'null' && !idFileExists) {
            const existingIdFile = uploadedFiles.files.some(
                (uploadedFile) => uploadedFile.name === idFile.name
            )

            if (!existingIdFile) {
                if (existingApplication[0].identificationNoUrl) {
                    const idFileKey =
                        existingApplication[0].identificationFileUrl.split('f/')
                    await utapi.deleteFiles(idFileKey)
                }
                const uploadedID = await utapi.uploadFiles(idFile)
                uploadedIDFile = uploadedID.data.url
            }
        } else if (idFile === 'null' || !idFile || isIdFileRemoved) {
            if (existingApplication[0].identificationNoUrl) {
                const idFileKey =
                    existingApplication[0].identificationNoUrl.split('f/')
                await utapi.deleteFiles(idFileKey)
            }
            uploadedIDFile = null
        } else {
            if (idFileExists) {
                if (existingApplication[0].identificationNoUrl) {
                    uploadedIDFile = existingApplication[0]?.identificationNoUrl
                }
            }
        }

        // Handle Immigration File
        if (
            immigrationFile &&
            immigrationFile !== 'null' &&
            !immigrationFileExists
        ) {
            const existingFile = uploadedFiles.files.some(
                (uploadedFile) => uploadedFile.name === immigrationFile.name
            )

            if (!existingFile) {
                if (existingApplication[0].immigration_url) {
                    const fileKey =
                        existingApplication[0].immigration_url.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
                const uploadedFile = await utapi.uploadFiles(immigrationFile)
                uploadedImmigrationFileName = uploadedFile.data.name
                uploadedImmigrationFileUrl = uploadedFile.data.url
            }
        } else if (
            immigrationFile === 'null' ||
            !immigrationFile ||
            isImmigrationFileRemoved
        ) {
            if (existingApplication[0].immigration_url) {
                const fileKey =
                    existingApplication[0].immigration_url.split('f/')
                await utapi.deleteFiles(fileKey)
            }
            uploadedImmigrationFileName = null
            uploadedImmigrationFileUrl = null
        } else {
            if (immigrationFileExists) {
                if (existingApplication[0].immigration_url) {
                    uploadedImmigrationFileName =
                        existingApplication[0]?.immigration_name
                    uploadedImmigrationFileUrl =
                        existingApplication[0]?.immigration_url
                }
            }
        }

        // Handle tuition document upload
        const tuitionDoc = photo.get('tuitionDoc')
        const tuitionDocExists =
            photo.get('tuitionDoc_alreadyExists') === 'true'
        const isTuitionDocRemoved = photo.get('tuitionDoc_isRemoved') === 'true'

        if (tuitionDoc && tuitionDoc !== 'null' && !tuitionDocExists) {
            if (existingApplication[0]?.tuition_doc_url) {
                const fileKey =
                    existingApplication[0].tuition_doc_url.split('f/')
                await utapi.deleteFiles(fileKey)
            }
            const uploadedFile = await utapi.uploadFiles(tuitionDoc)
            tuitionDocUrl = uploadedFile.data.url
            tuitionDocName = tuitionDoc.name
        } else if (
            tuitionDoc === 'null' ||
            !tuitionDoc ||
            isTuitionDocRemoved
        ) {
            if (existingApplication[0]?.tuition_doc_url) {
                const fileKey =
                    existingApplication[0].tuition_doc_url.split('f/')
                await utapi.deleteFiles(fileKey)
            }
        }

        await db.application.update({
            where: {
                id: existingApplication[0].id,
            },
            data: {
                courseID: existingCourse.id,
                photoName: uploadedPhotoFile || null,
                photoUrl: uploadedPhotoFileUrl || null,
                immigration_name: uploadedImmigrationFileName || null,
                immigration_url: uploadedImmigrationFileUrl || null,
                identificationNoUrl: uploadedIDFile || null,
                tuition_doc_url: tuitionDocUrl,
                tuition_doc_name: tuitionDocName,
                ...applicationValues,
            },
        })

        await handleSubmitPaymentPlan(existingApplication[0].id, parsedValues)

        // Handle deleting qualifications
        if (deletedQualifications.length > 0) {
            const qualificationsToDelete = await db.qualification.findMany({
                where: {
                    id: { in: deletedQualifications },
                },
            })

            for (const qual of qualificationsToDelete) {
                if (qual.url) {
                    const fileKey = qual.url.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
            }
        }

        if (qualifications) {
            // Qualifications
            for (let i = 0; i < qualifications.length; i++) {
                const qual = qualifications[i]
                const fileIndex = `qualification_file_${i}`
                const fileExists = `qualification_file_${i}_alreadyExists`
                const fileUrl = photo.get(fileIndex)

                console.log(fileIndex + ' ,' + fileUrl)

                if (qual.id) {
                    const existingQualification =
                        await db.qualification.findUnique({
                            where: {
                                id: qual.id,
                            },
                        })

                    if (existingQualification) {
                        if (fileUrl === 'null') {
                            if (existingQualification.url) {
                                const fileKey =
                                    existingQualification.url.split('f/')
                                await utapi.deleteFiles(fileKey)
                            }
                        } else if (
                            fileUrl &&
                            fileUrl !== 'null' &&
                            !(typeof fileUrl === 'string') &&
                            !fileExists
                        ) {
                            const uploadedFile = await utapi.uploadFiles(
                                fileUrl
                            )
                            if (existingQualification.url) {
                                const fileKey =
                                    existingQualification.url.split('f/')
                                await utapi.deleteFiles(fileKey)
                            }

                            await db.qualification.update({
                                where: {
                                    id: existingQualification.id,
                                },
                                data: {
                                    title: qual.title,
                                    examiningBody: qual.examiningBody,
                                    dateAwarded: qual.dateAwarded,
                                    url: uploadedFile.data.url,
                                    fileName: uploadedFile.data.name,
                                },
                            })
                        } else {
                            await db.qualification.update({
                                where: {
                                    id: existingQualification.id,
                                },
                                data: {
                                    applicationID: existingApplication[0].id,
                                    title: qual.title,
                                    examiningBody: qual.examiningBody,
                                    dateAwarded: qual.dateAwarded,
                                    fileName: existingQualification?.fileName,
                                    url: existingQualification?.url,
                                },
                            })
                        }
                    }
                } else {
                    let url = null
                    let name = null

                    if (fileUrl && fileUrl !== 'null') {
                        const uploadedFile = await utapi.uploadFiles(fileUrl)
                        url = uploadedFile.data.url
                        name = fileUrl.name
                    }

                    await db.qualification.create({
                        data: {
                            title: qual.title,
                            examiningBody: qual.examiningBody,
                            dateAwarded: qual.dateAwarded,
                            applicationID: existingApplication[0].id,
                            fileName: name,
                            url,
                        },
                    })
                }
            }
        }

        if (pendingQualifications) {
            for (let i = 0; i < pendingQualifications.length; i++) {
                const qual = pendingQualifications[i]

                if (qual.id) {
                    const existingPendingQualification =
                        await db.pendingQualification.findUnique({
                            where: {
                                id: qual.id,
                            },
                        })

                    if (existingPendingQualification) {
                        await db.pendingQualification.update({
                            where: {
                                id: existingPendingQualification.id,
                            },
                            data: {
                                title: qual.title,
                                examiningBody: qual.examiningBody,
                                dateOfResults: qual.dateOfResults,
                                subjectsPassed: qual.subjectsPassed,
                            },
                        })
                    }
                } else {
                    await db.pendingQualification.create({
                        data: {
                            applicationID: existingApplication[0].id,
                            title: qual.title,
                            examiningBody: qual.examiningBody,
                            dateOfResults: qual.dateOfResults,
                            subjectsPassed: qual.subjectsPassed,
                        },
                    })
                }
            }
        }

        // Handle deleting work experiences
        if (deletedWorkExperiences.length > 0) {
            const workExperiencesToDelete = await db.workExperience.findMany({
                where: {
                    id: { in: deletedWorkExperiences },
                },
            })

            for (const we of workExperiencesToDelete) {
                if (we.url) {
                    const fileKey = we.url.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
            }
        }

        if (hasWorkExperience === 'No') {
            const existingWorkExperiences = await db.workExperience.findMany({
                where: {
                    applicationID: existingApplication[0].id,
                },
            })

            for (const we of existingWorkExperiences) {
                if (we.url) {
                    const fileKey = we.url.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
            }
        }

        if (workExperience) {
            for (let i = 0; i < workExperience.length; i++) {
                const we = workExperience[i]
                const fileIndex = `work_experience_file_${i}`
                const fileExists = `work_experience_file_${i}_alreadyExists`
                const fileUrl = photo.get(fileIndex)

                if (we.id) {
                    const existingWorkExperience =
                        await db.workExperience.findUnique({
                            where: {
                                id: we.id,
                            },
                        })

                    if (existingWorkExperience) {
                        if (fileUrl === 'null') {
                            if (existingWorkExperience.url) {
                                const fileKey =
                                    existingWorkExperience.url.split('f/')
                                await utapi.deleteFiles(fileKey)
                            }
                        } else if (
                            fileUrl &&
                            fileUrl !== 'null' &&
                            !(typeof fileUrl === 'string') &&
                            !fileExists
                        ) {
                            const uploadedFile = await utapi.uploadFiles(
                                fileUrl
                            )
                            if (existingWorkExperience.url) {
                                const fileKey =
                                    existingWorkExperience.url.split('f/')
                                await utapi.deleteFiles(fileKey)
                            }

                            await db.workExperience.update({
                                where: {
                                    id: existingWorkExperience.id,
                                },
                                data: {
                                    title: we.title,
                                    nameOfOrganisation: we.nameOfOrganisation,
                                    natureOfJob: we.natureOfJob,
                                    jobStartDate: we.jobStartDate,
                                    jobEndDate: we.jobEndDate,
                                    url: uploadedFile.data.url,
                                    fileName: uploadedFile.data.name,
                                },
                            })
                        } else {
                            await db.workExperience.update({
                                where: {
                                    id: existingWorkExperience.id,
                                },
                                data: {
                                    title: we.title,
                                    nameOfOrganisation: we.nameOfOrganisation,
                                    natureOfJob: we.natureOfJob,
                                    jobStartDate: we.jobStartDate,
                                    jobEndDate: we.jobEndDate,
                                    url: existingWorkExperience?.url,
                                    fileName: existingWorkExperience?.fileName,
                                },
                            })
                        }
                    }
                } else {
                    let url = null
                    let name = null

                    if (fileUrl && fileUrl !== 'null') {
                        const uploadedFile = await utapi.uploadFiles(fileUrl)
                        url = uploadedFile.data.url
                        name = fileUrl.name
                    }

                    await db.workExperience.create({
                        data: {
                            title: we.title,
                            nameOfOrganisation: we.nameOfOrganisation,
                            natureOfJob: we.natureOfJob,
                            jobStartDate: we.jobStartDate,
                            jobEndDate: we.jobEndDate,
                            applicationID: existingApplication[0].id,
                            fileName: name,
                            url,
                        },
                    })
                }
            }
        }

        let signatureUrl = null

        if (signature) {
            const existingSignature = existingApplication[0].signatureUrl

            if (existingSignature) {
                const fileKey = existingSignature.split('f/')
                await utapi.deleteFiles(fileKey)
            }

            const signatureBlob = await fetch(signature).then((res) =>
                res.blob()
            )

            const file = new UTFile(
                [signatureBlob],
                `${existingApplication[0].id}-signature.png`
            )
            const uploadedSignature = await utapi.uploadFiles([file])
            signatureUrl = uploadedSignature[0].data.url

            await db.application.update({
                where: {
                    id: existingApplication[0].id,
                },
                data: {
                    signatureUrl,
                },
            })
        } else {
            const existingSignature = existingApplication[0].signatureUrl

            await db.application.update({
                where: {
                    id: existingApplication[0].id,
                },
                data: {
                    signatureUrl: existingSignature ? existingSignature : null,
                },
            })
        }

        await sendReSubmittedEmail(
            applicationValues.email || existingApplication[0].email,
            applicationValues.firstName || existingApplication[0].firstName,
            applicationValues.lastName || existingApplication[0].lastName,
            applicationValues.courseTitle || existingApplication[0].courseTitle,
            existingApplication[0].id
        ).then(async () => {
            await db.application.update({
                where: {
                    id: existingApplication[0].id,
                },
                data: {
                    status: 'Re_Submitted',
                    emailSentAt: new Date(),
                },
            })
        })

        return { success: 'Successfully submitted application!' }
    }

    // Submitting for the first time
    if (!existingSavedApplication && !existingApplication.length > 0) {
        const tuitionDoc = photo.get('tuitionDoc')

        if (userDetails) {
            await db.user.update({
                where: {
                    id: existingUser.id,
                },
                data: {
                    ...userDetails,
                },
            })
        }

        const uploadedPhotoFile =
            file && file !== 'null' ? await utapi.uploadFiles(file) : null
        const uploadedIdFile =
            idFile && idFile !== 'null' ? await utapi.uploadFiles(idFile) : null
        const uploadedImmigrationFile =
            immigrationFile && immigrationFile !== 'null'
                ? await utapi.uploadFiles(immigrationFile)
                : null
        const uploadedTuitionFile =
            tuitionDoc && tuitionDoc !== 'null'
                ? await utapi.uploadFiles(tuitionDoc)
                : null

        const applicationID = generateApplicationID()

        await db.application.create({
            data: {
                id: applicationID,
                ...applicationValues,
                photoName: uploadedPhotoFile ? file.name : null,
                photoUrl: uploadedPhotoFile ? uploadedPhotoFile.data.url : null,
                identificationNoUrl: uploadedIdFile
                    ? uploadedIdFile.data.url
                    : null,
                immigration_name: uploadedImmigrationFile
                    ? immigrationFile.name
                    : null,
                immigration_url: uploadedImmigrationFile
                    ? uploadedImmigrationFile.data.url
                    : null,
                tuition_doc_url: uploadedTuitionFile
                    ? uploadedTuitionFile.data.url
                    : null,
                tuition_doc_name: uploadedTuitionFile ? tuitionDoc.name : null,
                user: {
                    connect: {
                        id: user.id,
                    },
                },
                course: {
                    connect: {
                        id: existingCourse.id,
                    },
                },
            },
        })

        await handleSubmitPaymentPlan(applicationID, parsedValues)

        if (qualifications) {
            for (let i = 0; i < qualifications.length; i++) {
                const qual = qualifications[i]
                const fileIndex = `qualification_file_${i}`
                const fileUrl = photo.get(fileIndex)

                let url = null
                let name = null

                if (fileUrl && fileUrl !== 'null') {
                    const uploadedFile = await utapi.uploadFiles(fileUrl)
                    url = uploadedFile.data.url
                    name = fileUrl.name
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
                })
            }
        }

        if (pendingQualifications) {
            for (let i = 0; i < pendingQualifications.length; i++) {
                const qual = pendingQualifications[i]
                await db.pendingQualification.create({
                    data: {
                        title: qual.title,
                        examiningBody: qual.examiningBody,
                        dateOfResults: qual.dateOfResults,
                        subjectsPassed: qual.subjectsPassed,
                        applicationID,
                    },
                })
            }
        }

        if (workExperience) {
            for (let i = 0; i < workExperience.length; i++) {
                const we = workExperience[i]
                const fileKey = `work_experience_file_${i}`
                const file = photo.get(fileKey)

                let fileUrl = null
                let fileName = null

                if (file && file !== 'null') {
                    const uploadedFile = await utapi.uploadFiles(file)
                    fileUrl = uploadedFile.data.url
                    fileName = file.name
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
                })
            }
        }

        let signatureUrl = null

        if (signature) {
            const signatureBlob = await fetch(signature).then((res) =>
                res.blob()
            )

            const file = new UTFile(
                [signatureBlob],
                `${applicationID}-signature.png`
            )

            const uploadedSignature = await utapi.uploadFiles([file])
            signatureUrl = uploadedSignature[0].data.url

            await db.application.update({
                where: {
                    id: applicationID,
                },
                data: {
                    signatureUrl,
                },
            })
        }

        await sendRecievedApplicationEmail(
            applicationValues.email,
            applicationValues.firstName,
            applicationValues.lastName,
            applicationValues.courseTitle,
            applicationID
        ).then(async () => {
            await db.application.update({
                where: {
                    id: applicationID,
                },
                data: {
                    status: 'Submitted',
                    emailSentAt: new Date(),
                },
            })
        })

        return { success: 'Successfully submitted application!' }
    }

    // Saved -> Submitting
    if (existingSavedApplication && !existingApplication.length > 0) {
        let uploadedPhotoFile
        let uploadedPhotoFileUrl
        let uploadedIDFile
        let uploadedImmigrationFileName
        let uploadedImmigrationFileUrl
        let tuitionDocUrl = null
        let tuitionDocName = null

        if (userDetails) {
            await db.user.update({
                where: {
                    id: existingUser.id,
                },
                data: {
                    ...userDetails,
                },
            })
        }

        const applicationID = generateApplicationID()

        // Handle Profile Picture File
        if (file && file !== 'null' && !fileExists) {
            const existingFile = uploadedFiles.files.some(
                (uploadedFile) => uploadedFile.name === file.name
            )

            if (!existingFile) {
                if (existingSavedApplication.photoUrl) {
                    const fileKey =
                        existingSavedApplication.photoUrl.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
                const uploadedFile = await utapi.uploadFiles(file)
                uploadedPhotoFile = uploadedFile.data.name
                uploadedPhotoFileUrl = uploadedFile.data.url
            }
        } else if (file === 'null' || !file || isFileRemoved) {
            if (existingSavedApplication.photoUrl) {
                const fileKey = existingSavedApplication.photoUrl.split('f/')
                await utapi.deleteFiles(fileKey)
            }
            uploadedPhotoFile = null
        } else {
            if (fileExists) {
                if (existingSavedApplication.photoUrl) {
                    uploadedPhotoFile = existingSavedApplication?.photoName
                    uploadedPhotoFileUrl = existingSavedApplication?.photoUrl
                }
            }
        }

        // Handle Identification/Passport File
        if (idFile && idFile !== 'null' && !idFileExists) {
            const existingIdFile = uploadedFiles.files.some(
                (uploadedFile) => uploadedFile.name === idFile.name
            )

            if (!existingIdFile) {
                if (existingSavedApplication.identificationNoUrl) {
                    const idFileKey =
                        existingSavedApplication.identificationFileUrl.split(
                            'f/'
                        )
                    await utapi.deleteFiles(idFileKey)
                }
                const uploadedID = await utapi.uploadFiles(idFile)
                uploadedIDFile = uploadedID.data.url
            }
        } else if (idFile === 'null' || !idFile || isIdFileRemoved) {
            if (existingSavedApplication.identificationNoUrl) {
                const idFileKey =
                    existingSavedApplication.identificationNoUrl.split('f/')
                await utapi.deleteFiles(idFileKey)
            }
            uploadedIDFile = null
        } else {
            if (idFileExists) {
                if (existingSavedApplication.identificationNoUrl) {
                    uploadedIDFile =
                        existingSavedApplication?.identificationNoUrl
                }
            }
        }

        // Handle Immigration File
        if (
            immigrationFile &&
            immigrationFile !== 'null' &&
            !immigrationFileExists
        ) {
            const existingImmigrationFile = uploadedFiles.files.some(
                (uploadedFile) => uploadedFile.name === immigrationFile.name
            )

            if (!existingImmigrationFile) {
                if (existingSavedApplication.immigration_url) {
                    const fileKey =
                        existingSavedApplication.immigration_url.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
                const uploadedFile = await utapi.uploadFiles(immigrationFile)
                uploadedImmigrationFileName = uploadedFile.data.name
                uploadedImmigrationFileUrl = uploadedFile.data.url
            }
        } else if (
            immigrationFile === 'null' ||
            !immigrationFile ||
            isImmigrationFileRemoved
        ) {
            if (existingSavedApplication.immigration_url) {
                const fileKey =
                    existingSavedApplication.immigration_url.split('f/')
                await utapi.deleteFiles(fileKey)
            }
            uploadedImmigrationFileName = null
            uploadedImmigrationFileUrl = null
        } else {
            if (immigrationFileExists) {
                if (existingSavedApplication.immigration_url) {
                    uploadedImmigrationFileName =
                        existingSavedApplication?.immigration_name
                    uploadedImmigrationFileUrl =
                        existingSavedApplication?.immigration_url
                }
            }
        }

        // Handle tuition document upload
        const tuitionDoc = photo.get('tuitionDoc')
        const tuitionDocExists =
            photo.get('tuitionDoc_alreadyExists') === 'true'
        const isTuitionDocRemoved = photo.get('tuitionDoc_isRemoved') === 'true'

        if (tuitionDoc && tuitionDoc !== 'null' && !tuitionDocExists) {
            if (existingSavedApplication?.tuition_doc_url) {
                const fileKey =
                    existingSavedApplication.tuition_doc_url.split('f/')
                await utapi.deleteFiles(fileKey)
            }
            const uploadedFile = await utapi.uploadFiles(tuitionDoc)
            tuitionDocUrl = uploadedFile.data.url
            tuitionDocName = tuitionDoc.name
        } else if (
            tuitionDoc === 'null' ||
            !tuitionDoc ||
            isTuitionDocRemoved
        ) {
            if (existingSavedApplication.tuition_doc_url) {
                const fileKey =
                    existingSavedApplication.tuition_doc_url.split('f/')
                await utapi.deleteFiles(fileKey)
            }
            tuitionDocName = null
            tuitionDocUrl = null
        } else {
            if (tuitionDocExists) {
                if (existingSavedApplication.tuition_doc_url) {
                    tuitionDocName = existingSavedApplication?.tuition_doc_name
                    tuitionDocUrl = existingSavedApplication?.tuition_doc_url
                }
            }
        }

        // Create application
        await db.application.create({
            data: {
                id: applicationID,
                photoName: uploadedPhotoFile || null,
                photoUrl: uploadedPhotoFileUrl || null,
                identificationNoUrl: uploadedIDFile || null,
                immigration_name: uploadedImmigrationFileName || null,
                immigration_url: uploadedImmigrationFileUrl || null,
                tuition_doc_url: tuitionDocUrl,
                tuition_doc_name: tuitionDocName,
                ...applicationValues,
                user: {
                    connect: {
                        id: existingUser.id,
                    },
                },
                course: {
                    connect: {
                        id: existingCourse.id,
                    },
                },
            },
        })

        await handleSubmitPaymentPlan(applicationID, parsedValues)

        // Handle deleting qualifications
        if (deletedQualifications.length > 0) {
            const qualificationsToDelete = await db.savedQualification.findMany(
                {
                    where: {
                        id: { in: deletedQualifications },
                    },
                }
            )

            for (const qual of qualificationsToDelete) {
                if (qual.url) {
                    const fileKey = qual.url.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
            }
        }

        if (qualifications) {
            // Qualifications
            for (let i = 0; i < qualifications.length; i++) {
                const qual = qualifications[i]
                const fileIndex = `qualification_file_${i}`
                const fileExists = `qualification_file_${i}_alreadyExists`
                const fileUrl = photo.get(fileIndex)

                if (qual.id) {
                    const existingQualification =
                        await db.savedQualification.findUnique({
                            where: {
                                id: qual.id,
                            },
                        })

                    if (existingQualification) {
                        if (fileUrl === 'null') {
                            if (existingQualification.url) {
                                const fileKey =
                                    existingQualification.url.split('f/')
                                await utapi.deleteFiles(fileKey)
                            }
                        } else if (
                            fileUrl &&
                            fileUrl !== 'null' &&
                            !(typeof fileUrl === 'string') &&
                            !fileExists
                        ) {
                            const uploadedFile = await utapi.uploadFiles(
                                fileUrl
                            )
                            if (existingQualification.url) {
                                const fileKey =
                                    existingQualification.url.split('f/')
                                await utapi.deleteFiles(fileKey)
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
                            })
                        } else {
                            await db.qualification.create({
                                data: {
                                    applicationID,
                                    title: qual.title,
                                    examiningBody: qual.examiningBody,
                                    dateAwarded: qual.dateAwarded,
                                    fileName: existingQualification?.fileName,
                                    url: existingQualification?.url,
                                },
                            })
                        }

                        await db.savedQualification.delete({
                            where: {
                                id: qual.id,
                            },
                        })
                    }
                } else {
                    let url = null
                    let name = null

                    if (fileUrl && fileUrl !== 'null') {
                        const uploadedFile = await utapi.uploadFiles(fileUrl)
                        url = uploadedFile.data.url
                        name = fileUrl.name
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
                    })
                }
            }
        }

        if (pendingQualifications) {
            for (let i = 0; i < pendingQualifications.length; i++) {
                const qual = pendingQualifications[i]

                if (qual.id) {
                    await db.savedPendingQualification.delete({
                        where: {
                            id: qual.id,
                        },
                    })

                    await db.pendingQualification.create({
                        data: {
                            applicationID,
                            title: qual.title,
                            examiningBody: qual.examiningBody,
                            dateOfResults: qual.dateOfResults,
                            subjectsPassed: qual.subjectsPassed,
                        },
                    })
                } else {
                    await db.pendingQualification.create({
                        data: {
                            applicationID,
                            title: qual.title,
                            examiningBody: qual.examiningBody,
                            dateOfResults: qual.dateOfResults,
                            subjectsPassed: qual.subjectsPassed,
                        },
                    })
                }
            }
        }

        // Handle deleting work experiences
        if (deletedWorkExperiences.length > 0) {
            const workExperiencesToDelete =
                await db.savedWorkExperience.findMany({
                    where: {
                        id: { in: deletedWorkExperiences },
                    },
                })

            for (const we of workExperiencesToDelete) {
                if (we.url) {
                    const fileKey = we.url.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
            }
        }

        if (hasWorkExperience === 'No') {
            const existingWorkExperiences =
                await db.savedWorkExperience.findMany({
                    where: {
                        applicationID: existingSavedApplication.id,
                    },
                })

            for (const we of existingWorkExperiences) {
                if (we.url) {
                    const fileKey = we.url.split('f/')
                    await utapi.deleteFiles(fileKey)
                }
            }
        }

        if (workExperience) {
            for (let i = 0; i < workExperience.length; i++) {
                const we = workExperience[i]
                const fileIndex = `work_experience_file_${i}`
                const fileExists = `work_experience_file_${i}_alreadyExists`
                const fileUrl = photo.get(fileIndex)

                if (we.id) {
                    const existingWorkExperience =
                        await db.savedWorkExperience.findUnique({
                            where: {
                                id: we.id,
                            },
                        })

                    if (existingWorkExperience) {
                        if (fileUrl === 'null') {
                            if (existingWorkExperience.url) {
                                const fileKey =
                                    existingWorkExperience.url.split('f/')
                                await utapi.deleteFiles(fileKey)
                            }
                        } else if (
                            fileUrl &&
                            fileUrl !== 'null' &&
                            !(typeof fileUrl === 'string') &&
                            !fileExists
                        ) {
                            const uploadedFile = await utapi.uploadFiles(
                                fileUrl
                            )
                            if (existingWorkExperience.url) {
                                const fileKey =
                                    existingWorkExperience.url.split('f/')
                                await utapi.deleteFiles(fileKey)
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
                            })
                        } else {
                            await db.workExperience.create({
                                data: {
                                    applicationID,
                                    title: we.title,
                                    nameOfOrganisation: we.nameOfOrganisation,
                                    natureOfJob: we.natureOfJob,
                                    jobStartDate: we.jobStartDate,
                                    jobEndDate: we.jobEndDate,
                                    url: existingWorkExperience?.url,
                                    fileName: existingWorkExperience?.fileName,
                                },
                            })
                        }

                        await db.savedWorkExperience.delete({
                            where: {
                                id: we.id,
                            },
                        })
                    }
                } else {
                    let url = null
                    let name = null

                    if (fileUrl && fileUrl !== 'null') {
                        const uploadedFile = await utapi.uploadFiles(fileUrl)
                        url = uploadedFile.data.url
                        name = fileUrl.name
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
                    })
                }
            }
        }

        let signatureUrl = null

        if (signature) {
            if (existingSavedApplication.signatureUrl) {
                // Delete existing signature from uploadThing
                const existingSignatureKey =
                    existingSavedApplication.signatureUrl.split('f/')
                await utapi.deleteFiles(existingSignatureKey)
            }

            const signatureBlob = await fetch(signature).then((res) =>
                res.blob()
            )
            // Upload new signature
            const file = new UTFile(
                [signatureBlob],
                `${applicationID}-signature.png`
            )

            const uploadedSignature = await utapi.uploadFiles([file])

            signatureUrl = uploadedSignature[0].data.url

            // Update application with new signature URL
            await db.application.update({
                where: {
                    id: applicationID,
                },
                data: {
                    signatureUrl,
                },
            })
        }

        // Delete Saved Application
        await db.savedApplication.delete({
            where: {
                id: existingSavedApplication.id,
            },
        })

        await sendRecievedApplicationEmail(
            applicationValues.email || existingSavedApplication.email,
            applicationValues.firstName || existingSavedApplication.firstName,
            applicationValues.lastName || existingSavedApplication.lastName,
            applicationValues.courseTitle ||
                existingSavedApplication.courseTitle,
            existingSavedApplication.id
        ).then(async () => {
            await db.application.update({
                where: {
                    id: applicationID,
                },
                data: {
                    status: 'Submitted',
                    emailSentAt: new Date(),
                },
            })
        })

        return { success: 'Successfully submitted application!' }
    }
}
