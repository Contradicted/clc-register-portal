import NextAuth from "next-auth";

import authConfig from "@/auth.config";

import {
    protectedRoutes,
    authRoutes,
    apiAuthPrefix,
    DEFAULT_LOGIN_REDIRECT
} from "@/routes"

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);
    const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname);

    if (isApiAuthRoute) {
        return null;
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return null;
    }

    if (!isLoggedIn && isProtectedRoute) {
        let callbackURL = nextUrl.pathname;

        if (nextUrl.search) {
            callbackURL += nextUrl.search;
        }

        const encodedCallbackURL = encodeURIComponent(callbackURL);

        return Response.redirect(
            new URL(`/auth/login?callbackURL=${encodedCallbackURL}`, nextUrl)
        );
    }

    return null;
})

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};