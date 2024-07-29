'use server'

import { Resend } from 'resend'
import {
  RecievedEmailTemplate,
  ReSubmittedEmailTemplate,
} from "./emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY)

const domain = process.env.NEXT_PUBLIC_APP_URL

export const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${domain}/auth/new-password?token=${token}`

    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    })
}

export const sendRecievedApplicationEmail = async (
    email,
    firstName,
    lastName,
    courseTitle
) => {
    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'samee.aslam022@gmail.com',
        subject: 'City of London College - Your application',
        react: (
            <RecievedEmailTemplate
                firstName={firstName}
                lastName={lastName}
                courseTitle={courseTitle}
            />
        ),
    })

    if (error) {
        console.log(error)
    }
}

export const sendReSubmittedEmail = async (
  email,
  firstName,
  lastName,
  courseTitle
) => {
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "samee.aslam022@gmail.com",
    subject: "City of London College - Your application",
    react: (
      <ReSubmittedEmailTemplate
        firstName={firstName}
        lastName={lastName}
        courseTitle={courseTitle}
      />
    ),
  });

  if (error) {
    console.log(error);
  }
};