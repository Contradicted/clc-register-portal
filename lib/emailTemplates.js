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

export const RecievedEmailTemplate = ({
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
          Thank you for your interest in City of London College. Your
          application will be given full consideration and we will be in touch
          with you as soon as possible.
        </Text>
        <br />
        <Text style={text}>
          Regards,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          DISCLAIMER: This e-mail is confidential and should not be used by
          anyone who is not the original intended recipient. If you have
          received this e-mail in error, please inform the sender and delete it
          from your mailbox or any other storage mechanism Please note that City
          of London College does not accept any responsibility for viruses that
          may be contained in this e-mail or its attachments, and it is your own
          responsibility to scan for such viruses. City of London College (CLC)
          Ltd T/A City of London College is registered in England and Wales
          under registration number 11818935. Our Registered Office is at Suite
          100a Airport House, Purley Way, Croydon CR0 0XZ, England.
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
          DISCLAIMER: This e-mail is confidential and should not be used by
          anyone who is not the original intended recipient. If you have
          received this e-mail in error, please inform the sender and delete it
          from your mailbox or any other storage mechanism Please note that City
          of London College does not accept any responsibility for viruses that
          may be contained in this e-mail or its attachments, and it is your own
          responsibility to scan for such viruses. City of London College (CLC)
          Ltd T/A City of London College is registered in England and Wales
          under registration number 11818935. Our Registered Office is at Suite
          100a Airport House, Purley Way, Croydon CR0 0XZ, England.
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
