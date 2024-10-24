import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import { formatDateLong } from "./utils";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : ''

const now = new Date();

export const RecievedEmailTemplate = ({ firstName, lastName, courseTitle, id }) => (
  <Html>
    <Head />
    <Preview>
      {formatDateLong(now)} Dear {firstName + " " + lastName}, Application ID:{" "}
      {id}{" "}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>{formatDateLong(now)}</Text>
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Section>
          <Text style={sectionText}>
            <strong>Application ID:</strong> {id}
          </Text>
          <Text style={sectionText}>
            <strong>Student Name:</strong> {firstName + " " + lastName}
          </Text>
          <Text style={sectionText}>
            <strong>Course Applied for:</strong> {courseTitle}
          </Text>
        </Section>
        <Text style={text}>
          Thank you for your interest in joining City of London College. Your
          application will be given full consideration and we will be in touch
          with you within two working days.
        </Text>
        <br />
        <Text style={text}>
          Yours Sincerely,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const ReSubmittedEmailTemplate = ({
  firstName,
  lastName,
  courseTitle,
  id,
}) => (
  <Html>
    <Head />
    <Preview>
      {formatDateLong(now)} Dear {firstName + " " + lastName}, Application ID:{" "}
      {id}{" "}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>{formatDateLong(now)}</Text>
        <Text style={text}>Dear {firstName + " " + lastName},</Text>
        <Section>
          <Text style={sectionText}>
            <strong>Application ID:</strong> {id}
          </Text>
          <Text style={sectionText}>
            <strong>Student Name:</strong> {firstName + " " + lastName}
          </Text>
          <Text style={sectionText}>
            <strong>Course Applied for:</strong> {courseTitle}
          </Text>
        </Section>
        <Text style={text}>
          Thank you for re-submtting your application. Your application will be
          given full consideration and we will be in touch with you as soon as
          possible.
        </Text>
        <br />
        <Text style={text}>
          Regards,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const ResetPasswordEmailTemplate = ({ resetLink, firstName }) => (
  <Html>
    <Head />
    <Preview>Request to reset the password to your account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Hr />
        <Text style={text}>Dear {firstName},</Text>
        <Section>
          <Text style={text}>
            A request has been made to reset the password to your account. If
            this was you, please click the button below to reset your password.
          </Text>
          <Button style={button} href={resetLink}>
            Reset Password
          </Button>
        </Section>

        <Section>
          <Text style={text}>
            If you did not request a password reset, please ignore this email.
          </Text>
          <Text style={text}>
            To keep your account secure, please do not forward this email to
            anyone.
          </Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          NOTE: This e-mail message was sent from a notification-only address
          that cannot accept incoming e-mail. Please do not reply to this
          message.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '"Arial",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const text = {
  fontSize: "12px",
  lineHeight: "26px",
};

const sectionText = {
  fontSize: "12px",
  lineHeight: "26px",
  margin: "0px",
};

const btnContainer = {
  textAlign: "center",
};

const button = {
  backgroundColor: "#5F51E8",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center",
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "black",
  fontWeight: "bold",
  fontSize: "10px",
  lineHeight: "16px",
};
