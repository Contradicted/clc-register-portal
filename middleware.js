import NextAuth from 'next-auth'

import authConfig from '@/auth.config'

import {
    protectedRoutes,
    authRoutes,
    apiAuthPrefix,
    applicationRoutes,
    DEFAULT_LOGIN_REDIRECT,
    dashboardRoutes,
    editUserRoutes,
} from '@/routes'

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)
    const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname)
    const isDashboardRoute = dashboardRoutes.includes(nextUrl.pathname)
    const isEditUserRoute = editUserRoutes.includes(nextUrl.pathname)
    const isApplicationRoutes = applicationRoutes.includes(nextUrl.pathname)

    if (isApiAuthRoute) {
        return null
    }

    if (isAuthRoute) {
        if (isLoggedIn && !req.auth.user.hasApplication) {
            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
        }

        if (isLoggedIn && req.auth.user.hasApplication) {
            return Response.redirect(new URL('/dashboard', nextUrl))
        }
        return null
    }

    if (!isLoggedIn && isProtectedRoute) {
        let callbackURL = nextUrl.pathname

        if (nextUrl.search) {
            callbackURL += nextUrl.search
        }

        const encodedCallbackURL = encodeURIComponent(callbackURL)

        return Response.redirect(
            new URL(`/auth/login?callbackURL=${encodedCallbackURL}`, nextUrl)
        )
    }

    if (isLoggedIn) {
        if (
            (isApplicationRoutes || isEditUserRoute) &&
            req.auth.user.hasApplication
        ) {
            return Response.redirect(new URL('/dashboard', nextUrl))
        }

        if (isDashboardRoute && !req.auth.user.hasApplication) {
            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
        }
    }

    return null
})

// Optionally, don't invoke Middleware on some paths
export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
