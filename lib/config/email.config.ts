import { Resend } from "resend";

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const emailConfig = {
  from: "fignna.com <auth@fignna.com>",
  domain: "fignna.com",
};

// Email template generator
export function generateOTPEmailTemplate(
  otp: string,
  type: string
): { subject: string; html: string } {
  const emailSubject =
    type === "sign-in"
      ? "Sign in to fignna.com"
      : type === "email-verification"
      ? "Verify your email"
      : type === "forget-password"
      ? "Reset your password"
      : "Your verification code";

  const emailContent = `
<div style="max-width: 500px; margin: 0 auto; padding: 20px; font-family: system-ui, sans-serif;">
  <h2 style="text-align: center; color: #333; margin-bottom: 30px;">fignna.com</h2>
  
  <p style="color: #666; margin-bottom: 20px;">
    ${
      type === "sign-in"
        ? "Your sign-in code:"
        : type === "email-verification"
        ? "Your verification code:"
        : type === "forget-password"
        ? "Your password reset code:"
        : "Your code:"
    }
  </p>
  
  <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 4px; margin: 20px 0;">
    <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</span>
  </div>
  
  <p style="color: #888; font-size: 13px;">
    Expires in 10 minutes. Ignore if you didn't request this.
  </p>
</div>
  `;

  return {
    subject: emailSubject,
    html: emailContent,
  };
}

// Send OTP email function
export async function sendOTPEmail(email: string, otp: string, type: string) {
  try {
    const { subject, html } = generateOTPEmailTemplate(otp, type);

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("[Email Config] Failed to send OTP email:", error);

      // Handle different types of Resend errors
      let errorMessage = "Failed to send verification email";

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }

      throw new Error(errorMessage);
    }

    console.log(
      `[Email Config] OTP email sent successfully to ${email}:`,
      data?.id
    );
    return { success: true };
  } catch (error) {
    console.error("[Email Config] Error sending OTP email:", error);
    throw error;
  }
}
