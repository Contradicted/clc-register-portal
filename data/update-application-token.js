import { db } from "@/lib/db";

export const getUpdateApplicationTokenByToken = async (token) => {
  try {
    const updateApplicationToken = await db.updateApplicationToken.findUnique({
      where: { token },
    });

    return updateApplicationToken;
  } catch (error) {
    console.error("Failed to get token", error);
    return null;
  }
};

export const getUpdateApplicationTokenByEmail = async (email) => {
  try {
    const updateApplicationToken = await db.updateApplicationToken.findFirst({
      where: { email },
    });

    return updateApplicationToken;
  } catch {
    return null;
  }
};
