"use server";

import bcrypt from "bcryptjs";

import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

import { db } from "@/lib/db";
import { formatName, generateUserID } from "@/lib/utils";

export const register = async (values) => {
  try {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) return { error: "Invalid fields!" };

    const { title, firstName, lastName, email, password } =
      validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return { error: "Email already in use!" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = generateUserID();

    const formattedValues = {
      firstName: formatName(firstName),
      lastName: formatName(lastName),
      email: email.toLowerCase(),
    };

    await db.user.create({
      data: {
        id,
        title,
        ...formattedValues,
        password: hashedPassword,
      },
    });

    return { success: "User has been successfully created!" };
  } catch (error) {
    console.error("[REGISTERING_USER_ERROR]", error);
    return { error: "Something went wrong" };
  }
};