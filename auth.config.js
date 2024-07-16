import bcrypt from 'bcryptjs'

import Credentials from 'next-auth/providers/credentials'

import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import { getUserById } from '@/data/user'
import { getAccountById } from '@/data/account'
import { LoginSchema } from '@/schemas'
import { getUserByEmail } from '@/data/user'
import {
    getApplicationByUserID,
    getSavedApplicationByUserID,
} from './data/application'

export default {
    providers: [
        Credentials({
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials)

                if (validatedFields.success) {
                    const { email, password } = validatedFields.data

                    const user = await getUserByEmail(email)
                    if (!user || !user.password) return null

                    const passwordMatch = await bcrypt.compare(
                        password,
                        user.password
                    )

                    if (passwordMatch) return user
                }

                return null
            },
        }),
    ],
    pages: {
        signIn: '/auth/login',
    },
    adapter: PrismaAdapter(db),
    session: { strategy: 'jwt' },
    callbacks: {
        jwt: async ({ token }) => {
            if (!token.sub) return token

            const existingUser = await getUserById(token.sub)

            if (!existingUser) return token

            const existingAccount = await getAccountById(existingUser.id)
            const hasApplication = await getApplicationByUserID(existingUser.id)

            token.isOAuth = !!existingAccount
            token.id = existingUser.id
            token.firstName = existingUser.firstName
            token.lastName = existingUser.lastName
            token.email = existingUser.email
            token.role = existingUser.role
            token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled
            token.hasApplication = hasApplication.length > 0 ? true : false

            return token
        },
        session: async ({ session, token }) => {
            if (session.user) {
                session.user.firstName = token.firstName
                session.user.lastName = token.lastName
                session.user.email = token.email
                session.user.id = token.id
                session.user.hasApplication = token.hasApplication
            }

            return session
        },
    },
    secret: process.env.AUTH_SECRET || 'secret',
}
