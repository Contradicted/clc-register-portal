"use server";

import { AuthError } from "next-auth"

import { signIn } from "@/auth";
import { getUserByEmail } from "@/data/user";
import { LoginSchema } from "@/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const login = async (values, callbackURL) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) return { error: "Invalid fields!"}

    const { email, password } = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if (!existingUser || !existingUser.email || !existingUser.password) return { error: "User does not exist!"}

    try {
        await signIn("credentials", {
          email,
          password,
          redirectTo: DEFAULT_LOGIN_REDIRECT || callbackURL,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid Credentials!"}
                default:
                    return { error: "Something went wrong!"}
            }
        }

        throw error;
    }
}