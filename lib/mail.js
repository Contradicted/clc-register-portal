'use server'

import { Resend } from 'resend'
import {
  RecievedEmailTemplate,
  ResetPasswordEmailTemplate,
  ReSubmittedEmailTemplate,
} from "./emailTemplates";
import { formatDateLong } from "./utils";
import { sendEmail } from "./nodemailer";
import { render } from "@react-email/components";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL;

export const sendPasswordResetEmail = async (email, firstName, token) => {
  const resetLink = `${domain}/auth/new-password?token=${token}`;

  const options = {
    to: email,
    subject: "Reset your password",
    html: render(
      <ResetPasswordEmailTemplate resetLink={resetLink} firstName={firstName} />
    ),
  };

  // await resend.emails.send({
  //   from: "onboarding@resend.dev",
  //   to: email,
  //   subject: "Reset your password",
  //   html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  // });

  const { error } = await sendEmail(options);

  if (error) {
    console.log("[RESET_PASSWORD_EMAIL_ERROR]", error);
  }
};

export const sendRecievedApplicationEmail = async (
  email,
  firstName,
  lastName,
  courseTitle,
  id
) => {
  const options = {
    to: email,
    subject: "City of London College - Acknowledgement of Application",
    html: render(
      <RecievedEmailTemplate
        firstName={firstName}
        lastName={lastName}
        courseTitle={courseTitle}
        id={id}
      />
    ),
  };

  const { error } = await sendEmail(options);

  if (error) {
    console.log("[RECIEVED_EMAIL_ERROR]", error);
  }

  // const { data, error } = await resend.emails.send({
  //   from: "onboarding@resend.dev",
  //   to: "samee.aslam022@gmail.com",
  //   subject: "City of London College - Acknowledgement of Application",
  //   react: (
  //     <RecievedEmailTemplate
  //       firstName={firstName}
  //       lastName={lastName}
  //       courseTitle={courseTitle}
  //       id={id}
  //     />
  //   ),
  // });
};

export const sendReSubmittedEmail = async (
  email,
  firstName,
  lastName,
  courseTitle,
  id
) => {
  const options = {
    to: email,
    subject:
      "City of London College - Acknowledgement of Re-Submitted Application",
    html: render(
      <ReSubmittedEmailTemplate
        firstName={firstName}
        lastName={lastName}
        courseTitle={courseTitle}
        id={id}
      />
    ),
  };

  const { error } = await sendEmail(options);

  // const { data, error } = await resend.emails.send({
  //   from: "onboarding@resend.dev",
  //   to: "samee.aslam022@gmail.com",
  //   subject:
  //     "City of London College - Acknowledgement of Re-Submitted Application",
  //   react: (
  //     <ReSubmittedEmailTemplate
  //       firstName={firstName}
  //       lastName={lastName}
  //       courseTitle={courseTitle}
  //       id={id}
  //     />
  //   ),
  // });

  if (error) {
    console.log("[RE_SUBMISSION_EMAIL_ERROR]", error);
  }
};