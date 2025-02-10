import { db } from "@/lib/db";

export const getFinanceInfoByUserID = async (userID) => {
  try {
    const data = await db.application.findFirst({
      where: {
        userID,
      },
      select: {
        courseTitle: true,
        tuitionFees: true,
        tuition_doc_name: true,
        tuition_doc_url: true,
        paymentPlan: true,
        course: {
          include: {
            course_study_mode: true,
          },
        },
        studyMode: true,
      },
    });

    return data;
  } catch (error) {
    console.log("[GET_FINANCE_INFO_BY_USER_ID_ERROR]", error);
    return null;
  }
};
