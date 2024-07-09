/**
 * An array of routes that are protected.
 * These routes require authentication
 */
export const protectedRoutes = ["/", "/user-details", "/user-details/edit"]

/**
 * An array of routes that are used for authentication.
 * These routes will redirect the user to the root page
 */
export const authRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/reset",
    "/auth/new-password"
]

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API
 authentication purposes
 */
export const apiAuthPrefix = "/api/auth"

/**
 * An array of routes that are used for the application.
 * These routes require the user to have an active application
 */
export const applicationRoutes = [
  "/application",
];

/**
 * The default redirect path after logging in
 */
export const DEFAULT_LOGIN_REDIRECT = "/user-details";
