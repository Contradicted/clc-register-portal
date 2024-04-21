import { PrismaClient } from "@prisma/client";

// Initialise Prisma client - globalThis is not affected with NextJS hot-reload
export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
