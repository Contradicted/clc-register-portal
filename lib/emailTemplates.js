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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : ''

console.log(process.env.NEXT_PUBLIC_APP_URL)

export const RecievedEmailTemplate = ({ firstName, lastName, courseTitle }) => (
    <Html>
        <Head />
        <Preview>{courseTitle}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Img
                    src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
                    width="220"
                    height="140"
                    alt="clc-logo"
                    style={logo}
                />
                <Text style={paragraph}>
                    Dear {firstName + ' ' + lastName},
                </Text>
                <Text style={paragraph}>
                    Thank you for your application for the {courseTitle}.
                    <br />
                    <br />
                    Your application will be given full consideration and we
                    will be in touch with you as soon as possible.
                </Text>
                <Text style={paragraph}>
                    Regards,
                    <br />
                    CLC Admissions Office
                </Text>
                <Hr style={hr} />
                <Text style={footer}>
                    3 Boyd Street, Aldgate East, London, E1 1FQ,
                </Text>
            </Container>
        </Body>
    </Html>
)

export const ReSubmittedEmailTemplate = ({
  firstName,
  lastName,
  courseTitle,
}) => (
  <Html>
    <Head />
    <Preview>{courseTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://www.clc-london.ac.uk/wp-content/uploads/2024/02/CLC-322-strapline-1-scaled-3.jpg"
          width="220"
          height="140"
          alt="clc-logo"
          style={logo}
        />
        <Text style={paragraph}>Dear {firstName + " " + lastName},</Text>
        <Text style={paragraph}>
          Thank you for re-submitting your application for the {courseTitle}.
          <br />
          <br />
          Your application will be reviewed and we will be in touch with you as
          soon as possible.
        </Text>
        <Text style={paragraph}>
          Regards,
          <br />
          CLC Admissions Office
        </Text>
        <Hr style={hr} />
        <Text style={footer}>3 Boyd Street, Aldgate East, London, E1 1FQ,</Text>
      </Container>
    </Body>
  </Html>
);

const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
}

const logo = {
    margin: '0 auto',
}

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
}

const btnContainer = {
    textAlign: 'center',
}

const button = {
    backgroundColor: '#5F51E8',
    borderRadius: '3px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    padding: '12px',
}

const hr = {
    borderColor: '#cccccc',
    margin: '20px 0',
}

const footer = {
    color: '#8898aa',
    fontSize: '12px',
}
