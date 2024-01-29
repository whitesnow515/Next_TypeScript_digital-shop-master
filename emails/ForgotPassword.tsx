import * as React from "react";

import { Body } from "@react-email/body";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Link } from "@react-email/link";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";

interface EmailProps {
  username: string;
  resetLink: string;
}

const main = {
  backgroundColor: "#0c0f15",
  margin: "0 auto",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  border: "1px solid #374151",
  backgroundColor: "#1f2937",
  borderRadius: "5px",
  margin: "40px auto",
  padding: "20px",
  width: "465px",
};

const link = {
  color: "#067df7",
  textDecoration: "none",
};

const text = {
  color: "#fff",
  fontSize: "14px",
  lineHeight: "24px",
};

const btn = {
  backgroundColor: "#ff8c00",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "50px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const hr = {
  border: "none",
  borderTop: "1px solid #eaeaea",
  margin: "26px 0",
  width: "100%",
};

const footer = {
  color: "#666666",
  fontSize: "12px",
  lineHeight: "24px",
};
export default function Email({
  username = "Username",
  resetLink = "https://google.com/",
}: EmailProps) {
  const previewText = "Reset your password";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading
            style={{
              color: "#fff",
              fontSize: "24px",
              fontWeight: "normal",
              textAlign: "center" as const,
              margin: "30px 0",
              padding: "0",
            }}
          >
            Password Reset
          </Heading>
          <Text style={text}>
            Hello <strong>{username}</strong>,
          </Text>
          <Text style={text}>
            You are receiving this email because we received a password reset
            request for your account.
          </Text>
          <Text style={text}>
            Click the button below continue the password reset process.
          </Text>
          <Section
            style={{
              textAlign: "center",
              marginTop: "26px",
              marginBottom: "26px",
            }}
          >
            <Button pX={20} pY={12} style={btn} href={resetLink}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            or copy and paste this URL into your browser:{" "}
            <Link
              href={resetLink}
              target="_blank"
              style={link}
              rel="noreferrer"
            >
              {resetLink}
            </Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you did not request a password reset, no further action is
            required.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
