"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { FinanceInfoSchema } from "@/schemas";
import { UTApi } from "uploadthing/server";

export const updateFinance = async (formData) => {
  try {
    const session = await auth();

    if (!session) {
      return { error: "Unauthorized" };
    }

    // Convert FormData to a regular object
    const values = {};
    formData.forEach((value, key) => {
      if (key === "expectedPayments" || key === "paymentStatus") {
        values[key] = JSON.parse(value);
      } else if (
        key === "tuitionFeeAmount" ||
        key === "maintenanceLoanAmount" ||
        key === "courseFee" ||
        key === "shortfall"
      ) {
        values[key] = value ? Number(value) : undefined;
      } else if (key === "deleteExistingTuitionDoc") {
        values[key] = value === "true";
      } else if (key === "tuitionDoc") {
        values[key] = value;
      } else {
        values[key] = value;
      }
    });

    const validatedFields = FinanceInfoSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: validatedFields.error.message };
    }

    const {
      tuitionFees,
      hasSlcAccount,
      previouslyReceivedFunds,
      previousFundingYear,
      appliedForCourse,
      crn,
      slcStatus,
      tuitionFeeAmount,
      maintenanceLoanAmount,
      ssn,
      expectedPayments,
      courseFee,
      shortfall,
      tuitionDoc,
      deleteExistingTuitionDoc,
    } = validatedFields.data;

    // Get existing application
    const existingApplication = await db.application.findFirst({
      where: {
        userID: session.user.id,
      },
      include: {
        paymentPlan: true,
      },
    });

    if (!existingApplication) {
      return { error: "Application not found" };
    }

    // Initialize file variables
    let tuition_doc_url = existingApplication.tuition_doc_url;
    let tuition_doc_name = existingApplication.tuition_doc_name;

    // Check if we're switching away from SLC
    const isLeavingSLC =
      existingApplication.tuitionFees ===
        "Student Loan Company England (SLC)" &&
      tuitionFees !== "Student Loan Company England (SLC)";

    // Check if SLC status is changing from approved to another state
    const wasApprovedTuition =
      existingApplication.paymentPlan?.slcStatus ===
        "Approved - Tuition Fees & Maintenance Loan" ||
      existingApplication.paymentPlan?.slcStatus === "Approved - Tuition Fees";
    const wasApprovedMaintenance =
      existingApplication.paymentPlan?.slcStatus ===
        "Approved - Tuition Fees & Maintenance Loan" ||
      existingApplication.paymentPlan?.slcStatus ===
        "Approved - Maintenance Loan";

    const isNowApprovedTuition =
      slcStatus === "Approved - Tuition Fees & Maintenance Loan" ||
      slcStatus === "Approved - Tuition Fees";
    const isNowApprovedMaintenance =
      slcStatus === "Approved - Tuition Fees & Maintenance Loan" ||
      slcStatus === "Approved - Maintenance Loan";

    const isNowRejected = slcStatus === "Rejected";

    // Determine what fields need to be cleared
    const shouldClearTuition =
      (wasApprovedTuition && !isNowApprovedTuition) || isNowRejected;
    const shouldClearMaintenance =
      (wasApprovedMaintenance && !isNowApprovedMaintenance) || isNowRejected;

    // Determine if we need to handle files
    const hasNewFile = !!tuitionDoc;
    const shouldDeleteFile = deleteExistingTuitionDoc === true;
    const needsFileCleanup =
      isLeavingSLC || shouldClearTuition || isNowRejected;
    const hasExistingFile = Boolean(existingApplication.tuition_doc_url);

    // Check if we're switching away from SLC account
    const isLeavingSLCAccount =
      existingApplication.paymentPlan?.hasSlcAccount === true &&
      hasSlcAccount === "No";

    // Handle SLC account cleanup if switching to No
    if (isLeavingSLCAccount) {
      if (existingApplication.paymentPlan) {
        await db.paymentPlan.update({
          where: {
            id: existingApplication.paymentPlan.id,
          },
          data: {
            hasSlcAccount: false,
            previouslyReceivedFunds: null,
            previousFundingYear: null,
            appliedForCourse: null,
            crn: null,
            slcStatus: null,
            tuitionFeeAmount: null,
            maintenanceLoanAmount: null,
            ssn: null,
            expectedPayments: [],
          },
        });
      }

      return {
        success: "Finance information updated",
      };
    }

    // Handle file cleanup first if needed
    if (needsFileCleanup && hasExistingFile) {
      const utapi = new UTApi();
      const fileKey = existingApplication.tuition_doc_url.split("/").pop();
      await utapi.deleteFiles(fileKey);
      tuition_doc_url = null;
      tuition_doc_name = null;
    }
    // Handle new file upload if not clearing and have new file
    else if (!needsFileCleanup && hasNewFile) {
      const alreadyExists = formData.get("alreadyExists") === "true";
      if (!alreadyExists) {
        const utapi = new UTApi();
        // Delete existing file if there is one
        if (hasExistingFile) {
          const fileKey = existingApplication.tuition_doc_url.split("/").pop();
          await utapi.deleteFiles(fileKey);
        }

        // Upload new file
        const uploadResponse = await utapi.uploadFiles(tuitionDoc);
        if (uploadResponse?.data?.url) {
          tuition_doc_url = uploadResponse.data.url;
          tuition_doc_name = tuitionDoc.name;
        }
      }
    }
    // Handle explicit file deletion
    else if (shouldDeleteFile && hasExistingFile) {
      const utapi = new UTApi();
      const fileKey = existingApplication.tuition_doc_url.split("/").pop();
      await utapi.deleteFiles(fileKey);
      tuition_doc_url = null;
      tuition_doc_name = null;
    }

    // Handle SLC cleanup if leaving
    if (isLeavingSLC) {
      // Delete payment plan if it exists
      if (existingApplication.paymentPlan) {
        await db.paymentPlan.delete({
          where: {
            id: existingApplication.paymentPlan.id,
          },
        });
      }

      await db.application.update({
        where: {
          id: existingApplication.id,
        },
        data: {
          tuitionFees,
          tuition_doc_name,
          tuition_doc_url,
        },
      });

      return { success: "Finance information updated" };
    }

    // Start a transaction to handle both application and payment plan updates
    const updatedApplication = await db.$transaction(async (tx) => {
      // Update application
      const application = await tx.application.update({
        where: {
          id: existingApplication.id,
        },
        data: {
          tuitionFees,
          ...(hasNewFile || shouldDeleteFile || needsFileCleanup
            ? {
                tuition_doc_url,
                tuition_doc_name,
              }
            : {}),
          updatedAt: new Date(),
        },
      });

      // Only handle payment plan if staying with SLC
      if (
        !isLeavingSLC &&
        tuitionFees === "Student Loan Company England (SLC)"
      ) {
        // Update or create payment plan with cleared fields if status changed
        const paymentPlan = await tx.paymentPlan.upsert({
          where: {
            applicationID: existingApplication.id,
          },
          create: {
            paymentOption: "SLC",
            applicationID: existingApplication.id,
            hasSlcAccount: hasSlcAccount === "Yes",
            previouslyReceivedFunds: previouslyReceivedFunds === "Yes",
            previousFundingYear,
            appliedForCourse: appliedForCourse === "Yes",
            crn,
            slcStatus,
            tuitionFeeAmount: shouldClearTuition ? null : tuitionFeeAmount,
            maintenanceLoanAmount: shouldClearMaintenance
              ? null
              : maintenanceLoanAmount,
            ssn,
            courseFee: courseFee ? parseFloat(courseFee) : null,
            shortfall,
            expectedPayments: shouldClearTuition ? [] : expectedPayments,
            updatedAt: new Date(),
          },
          update: {
            hasSlcAccount: hasSlcAccount === "Yes",
            previouslyReceivedFunds: previouslyReceivedFunds === "Yes",
            previousFundingYear,
            appliedForCourse: appliedForCourse === "Yes",
            crn,
            slcStatus,
            tuitionFeeAmount: shouldClearTuition ? null : tuitionFeeAmount,
            maintenanceLoanAmount: shouldClearMaintenance
              ? null
              : maintenanceLoanAmount,
            ssn,
            courseFee: courseFee ? parseFloat(courseFee) : null,
            shortfall,
            expectedPayments: shouldClearTuition ? [] : expectedPayments,
            updatedAt: new Date(),
          },
        });
        return { success: "Finance information updated" };
      }

      return { success: "Finance information updated" };
    });

    revalidatePath("/dashboard/finance-info");
    return { success: "Finance information updated" };
  } catch (error) {
    console.error("UPDATE_FINANCE_ERROR", error);
    return { error: "Something went wrong!" };
  }
};
