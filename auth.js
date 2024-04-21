import NextAuth from "next-auth";
import authConfig from "@/auth.config";

import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db";
import { LoginSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { getAccountById } from "@/data/account";

export const { 
    handlers, 
    signIn, 
    signOut, 
    auth 
} = NextAuth({
    pages: {
        signIn: "/auth/login"
    },
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt"},
    callbacks: {
        jwt: async ({ token }) => {
            if (!token.sub) return token;

            const existingUser = await getUserById(token.sub);

            if (!existingUser) return token;

            const existingAccount = await getAccountById(existingUser.id);

            token.isOAuth = !!existingAccount;
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.role = existingUser.role;
            token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

            return token;
        }
    },
    ...authConfig,
})