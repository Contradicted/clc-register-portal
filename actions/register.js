"use server";

import bcrypt from "bcryptjs";

import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

import { db } from "@/lib/db";
import { generateUserID } from "@/lib/utils";

export const register = async (values) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) return { error: "Invalid fields!"};

    const { title, firstName, lastName, email, password } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
        return { error: "Email already in use!"}
    }

    const id = generateUserID();

    await db.user.create({
        data: {
            id,
            title,
            firstName,
            lastName,
            email,
            password: hashedPassword
        }
    })

    return { success: "User has been successfully created!"}    
}