/**
 * Email sending utility.
 * - If RESEND_API_KEY is set: sends via Resend
 * - If not set: logs to console (dev mode)
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev mode: log to console
    console.log("\n📧 [DEV] Email would be sent:");
    console.log(`   To: ${params.to}`);
    console.log(`   Subject: ${params.subject}`);
    console.log(`   HTML length: ${params.html.length} chars`);
    console.log("");
    return { success: true, messageId: "dev-" + Date.now() };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const fromAddress = process.env.EMAIL_FROM || "FinFlow <noreply@finflow.app>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[email] Send error:", err);
    return { success: false, error: String(err) };
  }
}
