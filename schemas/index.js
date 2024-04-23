import { isAdult } from "@/lib/utils";
import * as z from "zod";

export const LoginSchema = z.object({
    email: z.string().email({
        message: "Email is required"
    }),
    password: z.string().min(1, {
        message: "Password is required"
    })
});

export const RegisterSchema = z.object({
    title: z.string().min(1, {
        message: "Title is required"
    }),
    firstName: z.string().min(1, {
        message: "First name is required"
    }),
    lastName: z.string().min(1, {
        message: "Last name is required"
    }),
    email: z.string().email({
        message: "Email is required"
    }),
    password: z.string().min(1, {
        message: "Password is required"
    })
});

export const ResetPasswordSchema = z.object({
    email: z.string().email({
        message: "Email is required"
    })
});

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const EditUserDetailsSchema = z.object({
    firstName: z.string().min(1, {
        message: "First Name is required"
    }),
    lastName: z.string().min(1, {
        message: "Last name is required"
    }),
    dateOfBirth: 
    z.date({
        required_error: "A date of birth is required"
    })
        .refine(isAdult, {
            message: "You must be aged 18 or older"
        })
        .refine((date) => {
            return date < new Date(Date.now());
        }, {
            message: "The date must be before today"
        }),
    gender: z.string({
        required_error: "Gender is required"
    })
    .refine((value) => {
        return value === "Male" || value === "Female" || value === "Non-binary"
    }, {
        message: "Gender must either be Male, Female or Non-binary"
    })
})

