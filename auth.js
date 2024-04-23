import NextAuth from "next-auth";
import authConfig from "@/auth.config";

import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db";
import { getUserById } from "@/data/user";
import { getAccountById } from "@/data/account";

export const { 
    handlers, 
    signIn, 
    signOut, 
    auth 
} = NextAuth({
    pages: {
        signIn: "/auth/login",
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
        },
        session: async ({ session, token }) => {
            if (session.user) {
              session.user.name = token.name;
              session.user.email = token.email;
            }

            return session;
        }
    },
    ...authConfig,
})