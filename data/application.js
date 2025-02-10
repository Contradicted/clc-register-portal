import { db } from '@/lib/db'

export const getApplicationByUserID = async (userID) => {
    try {
        const application = await db.application.findMany({
          where: {
            userID: userID,
          },
          include: {
            qualifications: true,
            pendingQualifications: true,
            workExperience: true,
            updateApplicationToken: true,
          },
        });

        return application
    } catch (error) {
        console.log(error)
        return null
    }
}

export const getApplicationIDByUserID = async (userID) => {
  try {
    const application = await db.application.findUnique({
      where: {
        userID: userID,
      },
      select: {
        id: true,
        courseID: true,
      },
    });

    return application.courseID;
  } catch (error) {
    console.log("[FETCHING_APPLICATION_ID_BY_USER_ID_ERROR]", error);
    return null;
  }
};

export const getSavedApplicationByUserID = async (userID) => {
    try {
        const savedApplication = await db.savedApplication.findFirst({
          where: {
            userID,
          },
          include: {
            qualifications: true,
            pendingQualifications: true,
            workExperience: true,
            paymentPlan: true,
          },
        });

        return savedApplication
    } catch {
        return null
    }
}

export const getSavedApplicationQualificationsByUserID = async (userID) => {
    try {
        const savedQualification = await db.savedApplication.findFirst({
            where: {
                userID,
            },
            select: {
                qualifications,
            },
        })

        return savedQualification
    } catch {
        return null
    }
}
