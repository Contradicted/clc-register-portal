"use server";

import { getUserByEmail } from "@/data/user";
import { ResetPasswordSchema } from "@/schemas";

import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

export const reset = async (values) => {
    const validatedFields = ResetPasswordSchema.safeParse(values);

    if (!validatedFields.success) return { error: "Invalid email!"}

    const { email } = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if (!existingUser) return { error: "Email doesn't exist!"}

    const passwordResetToken = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token
    );

    return { success: "Reset email sent!"}
}