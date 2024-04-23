"use server";

import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { EditUserDetailsSchema } from "@/schemas";

export const update = async (values) => {
    const validatedFields = EditUserDetailsSchema.safeParse(values);

    if (!validatedFields.success) return { error: "Invalid fields!" }

    const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
    } = validatedFields.data

    const { username, addressLine1, addressLine2, city, postcode, homeTelephoneNo } = values;

    const existingUser = await getUserByEmail(username);

    if (!existingUser) return { error: "User doesn't exist!"}

    await db.user.update({
        where: {
            id: existingUser.id
        },
        data: {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            addressLine1,
            addressLine2,
            city,
            postcode,
            homeTelephoneNo
        }
    })

    return { success: "User details successfully updated!"}
}