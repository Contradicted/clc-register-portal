import { isAdult } from '@/lib/utils'
import * as z from 'zod'

const nameRegex = /^[A-Za-z\s]+$/ // Allows only letters and spaces
const identificationNoRegex = /^(?=.*[0-9])[A-Za-z0-9]+$/ // Must contain at least one number and can include letters
const postcodeRegEx = /^[a-z]{1,2}[0-9][0-9a-z]? ?[0-9][abd-hjlnp-uw-z]{2}$/i
const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format

export const LoginSchema = z.object({
    email: z.string().email({
        message: 'Email is required',
    }),
    password: z.string().min(1, {
        message: 'Password is required',
    }),
})

export const RegisterSchema = z.object({
    title: z.string().min(1, {
        message: 'Title is required',
    }),
    firstName: z.string().min(1, {
        message: 'First name is required',
    }),
    lastName: z.string().min(1, {
        message: 'Last name is required',
    }),
    email: z.string().email({
        message: 'Email is required',
    }),
    password: z.string().min(1, {
        message: 'Password is required',
    }),
})

export const ResetPasswordSchema = z.object({
    email: z.string().email({
        message: 'Email is required',
    }),
})

export const NewPasswordSchema = z.object({
    password: z.string().min(6, {
        message: 'Minimum of 6 characters required',
    }),
})

export const EditUserDetailsSchema = z.object({
    firstName: z.string().min(1, {
        message: 'First Name is required',
    }),
    lastName: z.string().min(1, {
        message: 'Last name is required',
    }),
    dateOfBirth: z
        .date({
            required_error: 'A date of birth is required',
        })
        .refine(isAdult, {
            message: 'You must be aged 18 or older',
        })
        .refine(
            (date) => {
                return date < new Date(Date.now())
            },
            {
                message: 'The date must be before today',
            }
        ),
    gender: z
        .string({
            required_error: 'Gender is required',
        })
        .refine(
            (value) => {
                return (
                    value === 'Male' ||
                    value === 'Female' ||
                    value === 'Non-binary'
                )
            },
            {
                message: 'Gender must either be Male, Female or Non-binary',
            }
        ),
})

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
          return value === "full_time" || value == "part_time";
        },
        {
          message: "Study mode must either be Full Time, Part Time",
        }
      ),
    title: z.string({
      required_error: "Title is required",
    }),
    campus: z.string({
      required_error: "Campus is required",
    }),
    firstName: z
      .string({
        required_error: "First name is required",
      })
      .regex(nameRegex, {
        message: "First name cannot contain numbers",
      }),
    lastName: z
      .string({
        required_error: "Last name is required",
      })
      .regex(nameRegex, {
        message: "Last name cannot contain numbers",
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
    placeOfBirth: z
      .string({
        required_error: "Place of Birth is required",
      })
      .regex(nameRegex, {
        message: "Place of Birth cannot contain numbers",
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
      .nullable()
      .optional(),
    immigration_status: z
      .string()
      .min(1, {
        message: "Immigration status is required",
      })
      .refine(
        (value) => {
          return value === "settled" || value === "pre_settled";
        },
        {
          message: "Immigration status must either be Settled or Pre Settled",
        }
      )
      .nullable()
      .optional(),
    share_code: z
      .string({
        required_error: "Share code is required",
      })
      .refine(
        (value) => {
          // Remove spaces and check if it's 9 characters long
          const cleanedValue = value.replace(/\s/g, "");
          return /^[A-Za-z0-9]{9}$/.test(cleanedValue);
        },
        {
          message:
            "Share code must be 9 characters long and contain only letters and numbers",
        }
      )
      .refine(
        (value) => {
          // Check if the share code follows the pattern: XXX-XXX-XXX (allowing spaces)
          return /^[A-Za-z0-9]{3}[\s-]?[A-Za-z0-9]{3}[\s-]?[A-Za-z0-9]{3}$/.test(
            value
          );
        },
        {
          message:
            "Share code must be in the format XXX-XXX-XXX (spaces or hyphens optional)",
        }
      )
      .nullable()
      .optional(),
    identificationNo: z
      .string({
        required_error: "Identification number is required",
      })
      .regex(identificationNoRegex, {
        message: "Identification number must contain at least one number",
      }),
    addressLine1: z.string({
      required_error: "Address Line 1 is required",
    }),
    city: z
      .string({
        required_error: "City is required",
      })
      .regex(nameRegex, {
        message: "City cannot contain numbers",
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
      data.countryOfBirth !== "United Kingdom" &&
      data.nationality == "British"
    ) {
      if (!data.entryDateToUK) {
        ctx.addIssue({
          path: ["entryDateToUK"],
          message: "Entry Date to UK is required",
        });
      }
    }

    if (data.nationality !== "British") {
      if (!data.immigration_status) {
        ctx.addIssue({
          path: ["immigration_status"],
          message: "Immigration status is required",
        });
      }
    }

    if (data.immigration_status === "pre_settled") {
      if (!data.share_code) {
        ctx.addIssue({
          path: ["share_code"],
          message: "Share code is required",
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
          })
          .refine(
            (value) => {
              // Allow letters, numbers, spaces, commas, and periods, but ensure it's not just numbers
              return /^(?!\d+$)[\p{L}\d\s,.'()-]+$/u.test(value);
            },
            {
              message:
                "Examining body must contain letters and can include numbers and basic punctuation",
            }
          ),
        dateAwarded: z
          .date({
            required_error: "Date awarded is required",
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
    .min(1, {
      message: "At least 1 qualification is required",
    })
    .max(3, {
      message: "Only 3 qualifications are allowed",
    }),
  addPendingQualifications: z.enum(["Yes", "No"], {
    required_error: "Please tick an option",
  }),
  // pendingQualifications: z
  //   .array(
  //     z.object({
  //       title: z
  //         .string({
  //           required_error: "Title is required",
  //         })
  //         .min(1, {
  //           message: "Title is required",
  //         })
  //         .regex(nameRegex, {
  //           message: "Title cannot contain numbers",
  //         }),
  //       examiningBody: z
  //         .string({
  //           required_error: "Examining Body is required",
  //         })
  //         .min(1, {
  //           message: "Examining Body is required",
  //         })
  //         .regex(nameRegex, {
  //           message: "Examining body cannot contain numbers",
  //         }),
  //       dateOfResults: z
  //         .date({
  //           required_error: "Date of Results is required",
  //         })
  //         .refine(
  //           (date) => {
  //             return new Date(date) > new Date(today);
  //           },
  //           {
  //             message: "Date cannot be in the past",
  //           }
  //         ),
  //       subjectsPassed: z
  //         .string({
  //           required_error: "Subjects passed is required",
  //         })
  //         .min(1, {
  //           message: "Subjects passed is required",
  //         }),
  //     })
  //   )
  //   .optional(),
  isEnglishFirstLanguage: z.string({
    required_error: "Please tick an option",
  }),
});
// .superRefine((data, ctx) => {
//   if (data.addPendingQualifications === "Yes") {
//     if (
//       !data.pendingQualifications ||
//       data.pendingQualifications.length === 0
//     ) {
//       ctx.addIssue({
//         path: ["pendingQualifications"],
//         message: "Please enter details for the pending qualification",
//       });
//     }
//   }
// });

export const SectionThreeSchema = z.object({
    addWorkExperience: z.enum(['Yes', 'No'], {
        required_error: 'Please tick an option',
    }),
})

export const SectionFourSchema = z.object({
    reasonsForChoosingProgram: z.string({
        required_error: 'Reasons for choosing program is required',
    }),
    futureEduPlans: z.string({
        required_error: 'Future educational plans is required',
    }),
    intentedEmployment: z.string({
        required_error: 'Plans about intended employment is required',
    }),
    hobbies: z.string({
        required_error: 'Hobbies is required',
    }),
    specialNeeds: z.string({
        required_error: 'Please answer the question related to special needs',
    }),
    stateBenefits: z.string({
        required_error: 'Please answer the question related to state benefits',
    }),
    criminalRecord: z.string({
        required_error: 'Please answer the question related to criminal record',
    }),
})

export const SectionFiveSchema = z.object({
    ethnicity: z
        .string({
            required_error: 'Please tick an option for ethnic origin',
        })
        .min(1, {
            message: 'Please tick an option for ethnic origin',
        }),
    religion: z
        .string({
            required_error: 'Please tick an option for religion',
        })
        .min(1, {
            message: 'Please tick an option for religion',
        }),
})

export const SectionSixSchema = z.object({
    marketing: z
        .string({
            required_error: 'Please tick an option for marketing',
        })
        .min(1, {
            message: 'Please tick an option for marketing',
        }),
    terms: z.boolean({
        required_error: 'Please agree to the terms and conditions',
    }),
})

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
                        message:
                            'All fields are required for additional qualifications',
                        path: [index, 'title'], // Adjust this path if necessary
                    })
                }
            })
        }),
    addPendingQualifications: z.enum(['Yes', 'No']),
    pendingQualifications: z
        .array(
            z.object({
                title: z
                    .string({
                        required_error: 'Title is required',
                    })
                    .min(1, {
                        message: 'Title is required',
                    }),
                examiningBody: z
                    .string({
                        required_error: 'Examining Body is required',
                    })
                    .min(1, {
                        message: 'Examining Body is required',
                    }),
                dateOfResults: z.date({
                    required_error: 'Date of Results is required',
                }),
                subjectsPassed: z
                    .string({
                        required_error: 'Subjects passed is required',
                    })
                    .min(1, {
                        message: 'Subjects passed is required',
                    }),
            })
        )
        .optional()
        .superRefine((pendingQualifications, ctx) => {
            const parent = ctx?.parent
            if (parent?.addPendingQualifications === 'Yes') {
                if (
                    !pendingQualifications ||
                    pendingQualifications.length === 0
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Pending qualifications are required',
                    })
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
                                message:
                                    'All fields are required for pending qualifications',
                                path: [index, 'title'],
                            })
                        }
                    })
                }
            }
        }),
})
