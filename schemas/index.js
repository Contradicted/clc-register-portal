import { formatCurrency, isAdult } from "@/lib/utils";
import * as z from "zod";

const nameRegex = /^[A-Za-z\s]+$/; // Allows only letters and spaces
const identificationNoRegex = /^(?=.*[0-9])[A-Za-z0-9]+$/; // Must contain at least one number and can include letters
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

const expectedPaymentSchema = z.object({
  date: z
    .date({
      required_error: "Payment date is required",
    })
    .optional(),
  amount: z.coerce
    .number({
      required_error: "Payment amount is required",
    })
    .positive("Amount must be greater than 0")
    .optional(),
  university: z
    .string({
      required_error: "University is required",
    })
    .optional(),
  course: z
    .string({
      required_error: "Course is required",
    })
    .optional(),
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
          return value === "full_time" || value == "part_time";
        },
        {
          message: "Study mode must either be Full Time, Part Time",
        }
      ),
    title: z.string({
      required_error: "Title is required",
    }),
    commencement: z
      .string({
        required_error: "Commencement is required",
      })
      .min(1, { message: "Commencement is required " }),
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
    emergency_contact_name: z
      .string({
        required_error: "Emergency contact name is required",
      })
      .min(1, { message: "Emergency contact name is required" })
      .regex(nameRegex, {
        message: "Emergency contact name cannot contain numbers",
      }),
    emergency_contact_no: z
      .string({
        required_error: "Emergency contact number is required",
      })
      .min(1, { message: "Emergency contact number is required" }),
    tuitionFees: z.string({
      required_error: "Tuition fee is required",
    }),
    hasSlcAccount: z.enum(["Yes", "No"]).optional(),
    previouslyReceivedFunds: z.enum(["Yes", "No"]).optional(),
    previousFundingYear: z.string().optional(),
    appliedForCourse: z.enum(["Yes", "No"]).optional(),
    crn: z
      .string()
      .regex(/^\d{11}$/, "CRN must be exactly 11 digits")
      .transform((value) => (value === "" ? undefined : value))
      .optional()
      .or(z.literal("")),
    slcStatus: z
      .enum(
        [
          "Approved - Tuition Fees & Maintenance Loan",
          "Approved - Tuition Fees",
          "Approved - Maintenance Loan",
          "Rejected",
          "In-process",
        ],
        { required_error: "Status is required" }
      )
      .optional(),
    tuitionFeeAmount: z
      .union([
        z.string().min(0),
        z.number().positive("Amount must be greater than 0"),
      ])
      .transform((val) => {
        if (typeof val === "string" && val === "") return undefined;
        if (typeof val === "string") {
          const num = parseFloat(val);
          return isNaN(num) ? undefined : num;
        }
        return val;
      })
      .refine(
        (val) => {
          if (val === undefined) return true;
          const str = val.toString();
          const decimals = str.includes(".") ? str.split(".")[1].length : 0;
          return decimals <= 2;
        },
        {
          message: "Maximum of 2 decimal places allowed",
        }
      )
      .optional(),
    maintenanceLoanAmount: z.coerce
      .number()
      .positive("Amount must be greater than 0")
      .optional(),
    ssn: z
      .string()
      .regex(
        /^[A-Z]{4}\d{8}[A-Z]$/,
        "SSN must be 4 letters followed by 8 numbers and ending with a letter"
      )
      .optional()
      .or(z.literal("")),
    usingMaintenanceForTuition: z.boolean().optional(),
    courseFee: z.number().optional(),
    expectedPayments: z.array(expectedPaymentSchema).optional(),
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

    if (
      data.immigration_status === "pre_settled" ||
      data.immigration_status === "settled"
    ) {
      if (!data.share_code) {
        ctx.addIssue({
          path: ["share_code"],
          message: "Share code is required",
        });
      }
    }

    // Only proceed with SLC-specific validation if SLC is selected
    if (data.tuitionFees === "Student Loan Company England (SLC)") {
      // Step 1: Basic SLC account validation
      if (!data.hasSlcAccount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify if you have an SLC account",
          path: ["hasSlcAccount"],
        });
        return;
      }

      // Step 2: Previous funding and application validation
      if (data.hasSlcAccount === "Yes") {
        if (!data.previouslyReceivedFunds) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify if you have previously received funds",
            path: ["previouslyReceivedFunds"],
          });
        }

        if (
          data.previouslyReceivedFunds === "Yes" &&
          !data.previousFundingYear
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify the year you received funding",
            path: ["previousFundingYear"],
          });
        }

        if (!data.appliedForCourse) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify whether you have applied for this course",
            path: ["appliedForCourse"],
          });
          return;
        }

        // Step 3: Application details validation
        if (data.appliedForCourse === "Yes") {
          if (!data.crn) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Please enter your CRN",
              path: ["crn"],
            });
          }

          if (!data.slcStatus) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Please select the status of your application",
              path: ["slcStatus"],
            });
            return;
          }

          // Step 4: Approved status validations
          if (data.slcStatus.startsWith("Approved")) {
            // Amount validations based on approval type
            if (
              data.slcStatus.includes("Tuition Fees") &&
              !data.tuitionFeeAmount
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Tuition fee amount is required",
                path: ["tuitionFeeAmount"],
              });
            }

            if (
              data.slcStatus.includes("Maintenance Loan") &&
              !data.maintenanceLoanAmount
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Maintenance loan amount is required",
                path: ["maintenanceLoanAmount"],
              });
            }

            // SSN validation
            if (!data.ssn) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "SSN is required",
                path: ["ssn"],
              });
            }

            // Step 5: Expected payments validation
            if (!data.expectedPayments || data.expectedPayments.length === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least one expected payment is required",
                path: ["expectedPayments"],
              });
              return;
            }

            // Validate individual payment fields
            data.expectedPayments.forEach((payment, index) => {
              if (!payment.date) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Payment date is required",
                  path: ["expectedPayments", index, "date"],
                });
              }
              if (!payment.amount) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Payment amount is required",
                  path: ["expectedPayments", index, "amount"],
                });
              }
              if (!payment.university) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "University is required",
                  path: ["expectedPayments", index, "university"],
                });
              }
              if (!payment.course) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Course is required",
                  path: ["expectedPayments", index, "course"],
                });
              }
            });

            // Step 6: Payment amount validation based on approval type
            const totalExpectedPayments = data.expectedPayments.reduce(
              (sum, payment) => sum + (payment.amount || 0),
              0
            );

            switch (data.slcStatus) {
              case "Approved - Tuition Fees":
                if (data.tuitionFeeAmount && !data.usingMaintenanceForTuition) {
                  if (
                    Math.abs(totalExpectedPayments - data.tuitionFeeAmount) >
                    0.01
                  ) {
                    ctx.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: `Total expected payments must equal the tuition fee amount of ${formatCurrency(
                        data.tuitionFeeAmount
                      )}`,
                      path: ["expectedPayments"],
                    });
                  }
                }
                break;

              case "Approved - Maintenance Loan":
                if (data.maintenanceLoanAmount) {
                  if (totalExpectedPayments > data.maintenanceLoanAmount) {
                    ctx.addIssue({
                      code: z.ZodIssueCode.custom,
                      message:
                        "Total payments cannot exceed maintenance loan amount",
                      path: ["expectedPayments"],
                    });
                  }
                }
                break;

              case "Approved - Tuition Fees & Maintenance Loan":
                if (data.tuitionFeeAmount) {
                  let expectedTotal = data.tuitionFeeAmount;

                  if (data.usingMaintenanceForTuition && data.courseFee) {
                    expectedTotal = data.courseFee - data.tuitionFeeAmount;

                    console.log("foo", expectedTotal);
                  }

                  if (Math.abs(totalExpectedPayments - expectedTotal) > 0.01) {
                    ctx.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: `Total expected payments must equal ${formatCurrency(
                        expectedTotal
                      )}`,
                      path: ["expectedPayments"],
                    });
                  }
                }
                break;
            }
          }
        }
      }
    }
  });

export const SectionTwoSchema = z
  .object({
    qualifications: z
      .array(
        z.object({
          title: z
            .string({
              invalid_type_error: "Title is required",
            })
            .min(1, {
              message: "Title is required",
            }),
          examiningBody: z
            .string({
              invalid_type_error: "Exam body is required",
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
              invalid_type_error: "Date awarded is required",
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
    pendingQualifications: z
      .array(
        z.object({
          title: z
            .string({
              invalid_type_error: "Title is required",
            })
            .min(1, {
              message: "Title is required",
            })
            .regex(nameRegex, {
              message: "Title cannot contain numbers",
            }),
          examiningBody: z
            .string({
              invalid_type_error: "Exam Body is required",
            })
            .min(1, {
              message: "Examining Body is required",
            })
            .regex(nameRegex, {
              message: "Examining body cannot contain numbers",
            }),
          dateOfResults: z
            .date({
              invalid_type_error: "Date of Results is required",
            })
            .refine(
              (date) => {
                return new Date(date) > new Date(today);
              },
              {
                message: "Date cannot be in the past",
              }
            ),
          subjectsPassed: z
            .string({
              invalid_type_error: "Subjects passed is required",
            })
            .min(1, {
              message: "Subjects passed is required",
            }),
        })
      )
      .optional(),
    isEnglishFirstLanguage: z.string({
      required_error: "Please tick an option",
    }),
  })
  .refine(
    (data) => {
      if (data.addPendingQualifications === "Yes") {
        return (
          data.addPendingQualifications &&
          data.pendingQualifications.length > 0 &&
          data.pendingQualifications.every(
            (qual) =>
              qual.title &&
              qual.examiningBody &&
              qual.dateOfResults &&
              qual.subjectsPassed
          )
        );
      }
      return true;
    },
    {
      message: "Enter pending qualification",
      path: ["pendingQualification"],
    }
  );

export const SectionThreeSchema = z
  .object({
    addWorkExperience: z.enum(["Yes", "No"], {
      required_error: "Please tick an option",
    }),
    workExperience: z
      .array(
        z
          .object({
            title: z
              .string({
                invalid_type_error: "Job Title is required",
              })
              .min(1, { message: "Job title is required" }),
            nameOfOrganisation: z
              .string({
                invalid_type_error: "Name of Organisation is required",
              })
              .min(1, { message: "Organisation name is required" }),
            natureOfJob: z
              .string({
                invalid_type_error: "Nature of job is required",
              })
              .min(1, { message: "Nature of Job is required" }),
            jobStartDate: z.date({
              invalid_type_error: "Job Start Date is required",
            }),
            jobEndDate: z.date({
              invalid_type_error: "Job End Date is required",
            }),
          })
          .refine(
            (data) => {
              if (data.jobStartDate && data.jobEndDate) {
                return new Date(data.jobStartDate) <= new Date(data.jobEndDate);
              }
              return true;
            },
            {
              message: "Job start date must before end date",
              path: ["jobStartDate"], // Changed to jobEndDate for better UX
            }
          )
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.addWorkExperience === "Yes") {
        return (
          data.addWorkExperience &&
          data.workExperience.length > 0 &&
          data.workExperience.every(
            (we) =>
              we.title &&
              we.nameOfOrganisation &&
              we.natureOfJob &&
              we.jobStartDate &&
              we.jobEndDate
          )
        );
      }
      return true;
    },
    {
      message: "Enter work experience",
      path: ["workExperience"],
    }
  );

export const SectionFourSchema = z.object({
  reasonsForChoosingProgram: z.string({
    required_error: "Reasons for choosing program is required",
  }),
  futureEduPlans: z.string({
    required_error: "Future educational plans is required",
  }),
  intentedEmployment: z.string({
    required_error: "Plans about intended employment is required",
  }),
  hobbies: z.string({
    required_error: "Hobbies is required",
  }),
  specialNeeds: z.string({
    required_error: "Please answer the question related to special needs",
  }),
  stateBenefits: z.string({
    required_error: "Please answer the question related to state benefits",
  }),
  criminalRecord: z.string({
    required_error: "Please answer the question related to criminal record",
  }),
});

export const SectionFiveSchema = z.object({
  ethnicity: z
    .string({
      required_error: "Please tick an option for ethnic origin",
    })
    .min(1, {
      message: "Please tick an option for ethnic origin",
    }),
  religion: z
    .string({
      required_error: "Please tick an option for religion",
    })
    .min(1, {
      message: "Please tick an option for religion",
    }),
});

export const SectionSixSchema = z.object({
  marketing: z
    .string({
      required_error: "Please tick an option for marketing",
    })
    .min(1, {
      message: "Please tick an option for marketing",
    }),
  terms: z.boolean({
    required_error: "Please agree to the terms and conditions",
  }),
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
