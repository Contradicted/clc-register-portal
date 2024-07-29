import { isAdult } from "@/lib/utils";
import * as z from "zod";

const postcodeRegEx = /^[a-z]{1,2}[0-9][0-9a-z]? ?[0-9][abd-hjlnp-uw-z]{2}$/i;
const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const RegisterSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  firstName: z.string().min(1, {
    message: "First name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const EditUserDetailsSchema = z.object({
  firstName: z.string().min(1, {
    message: "First Name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
  dateOfBirth: z
    .date({
      required_error: "A date of birth is required",
    })
    .refine(isAdult, {
      message: "You must be aged 18 or older",
    })
    .refine(
      (date) => {
        return date < new Date(Date.now());
      },
      {
        message: "The date must be before today",
      }
    ),
  gender: z
    .string({
      required_error: "Gender is required",
    })
    .refine(
      (value) => {
        return value === "Male" || value === "Female" || value === "Non-binary";
      },
      {
        message: "Gender must either be Male, Female or Non-binary",
      }
    ),
});

export const SectionOneSchema = z
  .object({
    courseTitle: z.string({
      required_error: "Course Title is required",
    }),
    studyMode: z
      .string({
        required_error: "Study Mode is required",
      })
      .refine(
        (value) => {
          return (
            value === "Full-Time" ||
            value == "Part-Time" ||
            value === "Blended-Learning"
          );
        },
        {
          message:
            "Study mode must either be Full Time, Part Time or Blended Learning",
        }
      ),
    title: z.string({
      required_error: "Title is required",
    }),
    firstName: z.string({
      required_error: "First name is required",
    }),
    lastName: z.string({
      required_error: "Last name is required",
    }),
    gender: z
      .string({
        required_error: "Gender is required",
      })
      .refine(
        (value) => {
          return (
            value === "Male" || value === "Female" || value === "Non-binary"
          );
        },
        {
          message: "Gender must either be Male, Female or Non-binary",
        }
      ),
    dateOfBirth: z
      .date({
        required_error: "A date of birth is required",
      })
      .refine(isAdult, {
        message: "You must be aged 18 or older",
      })
      .refine(
        (date) => {
          return date < new Date(Date.now());
        },
        {
          message: "The date must be before today",
        }
      ),
    placeOfBirth: z.string({
      required_error: "Place of Birth is required",
    }),
    countryOfBirth: z.string({
      required_error: "Country of Birth is required",
    }),
    nationality: z.string({
      required_error: "Nationality is required",
    }),
    entryDateToUK: z
      .date({
        required_error: "Entry date to UK is required",
      })
      .refine(
        (date) => {
          return date < new Date(Date.now());
        },
        {
          message: "The date must be before today",
        }
      )
      .optional(),
    identificationNo: z.string({
      required_error: "Identification number is required",
    }),
    addressLine1: z.string({
      required_error: "Address Line 1 is required",
    }),
    city: z.string({
      required_error: "City is required",
    }),
    postcode: z
      .string({
        required_error: "Zip/Post code is required",
      })
      .regex(postcodeRegEx, {
        message: "Invalid postcode",
      }),
    homeTelephoneNo: z.string({
      required_error: "Home telephone number is required",
    }),
    mobileNo: z.string({
      required_error: "Mobile number is required",
    }),
    email: z
      .string({
        required_error: "Email is required",
      })
      .email({
        message: "Please enter a valid email",
      }),
    tuitionFees: z.string({
      required_error: "Tuition fee is required",
    }),
  })
  .superRefine((data, ctx) => {
    if (
      data.countryOfBirth !== "United Kingdom" ||
      data.nationality !== "British"
    ) {
      if (!data.entryDateToUK) {
        ctx.addIssue({
          path: ["entryDateToUK"],
          message: "Entry Date to UK is required",
        });
      }
    }
  });

export const SectionTwoSchema = z.object({
  qualifications: z
    .array(
      z.object({
        title: z
          .string({
            required_error: "Title is required",
          })
          .min(1, {
            message: "Title is required",
          }),
        examiningBody: z
          .string({
            required_error: "Examining Body is required",
          })
          .min(1, {
            message: "Examining Body is required",
          }),
        dateAwarded: z
          .string({
            required_error: "Date awarded is required",
          })
          .min(1, {
            message: "Date awarded is required",
          })
          .refine(
            (date) => {
              return new Date(date) < new Date(today);
            },
            {
              message: "Date cannot be in the future",
            }
          ),
      })
    )
    .min(1, "At least one qualification is required")
    .max(3, "Only 3 qualifications are allowed"),
});

export const SectionTwoSavedSchema = z.object({
  qualifications: z
    .array(
      z.object({
        title: z.string().optional(),
        examiningBody: z.string().optional(),
        dateAwarded: z.union([z.string(), z.date()]).optional(),
      })
    )
    .superRefine((qualifications, ctx) => {
      qualifications.forEach((qual, index) => {
        if (
          index > 0 &&
          (!qual.title || !qual.examiningBody || !qual.dateAwarded)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "All fields are required for additional qualifications",
            path: [index, "title"], // Adjust this path if necessary
          });
        }
      });
    }),
  addPendingQualifications: z.enum(["Yes", "No"]),
  pendingQualifications: z
    .array(
      z.object({
        title: z
          .string({
            required_error: "Title is required",
          })
          .min(1, {
            message: "Title is required",
          }),
        examiningBody: z
          .string({
            required_error: "Examining Body is required",
          })
          .min(1, {
            message: "Examining Body is required",
          }),
        dateOfResults: z.date({
          required_error: "Date of Results is required",
        }),
        subjectsPassed: z
          .string({
            required_error: "Subjects passed is required",
          })
          .min(1, {
            message: "Subjects passed is required",
          }),
      })
    )
    .optional()
    .superRefine((pendingQualifications, ctx) => {
      const parent = ctx?.parent;
      if (parent?.addPendingQualifications === "Yes") {
        if (!pendingQualifications || pendingQualifications.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Pending qualifications are required",
          });
        } else {
          pendingQualifications.forEach((qual, index) => {
            if (
              !qual.title ||
              !qual.examiningBody ||
              !qual.dateOfResults ||
              !qual.subjectsPassed
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "All fields are required for pending qualifications",
                path: [index, "title"],
              });
            }
          });
        }
      }
    }),
});
