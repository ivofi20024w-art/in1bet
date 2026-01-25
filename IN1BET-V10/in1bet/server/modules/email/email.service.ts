import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[EMAIL] SMTP not configured - email sending disabled");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  console.log("[EMAIL] SMTP transporter initialized");
  return transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transport = getTransporter();
  
  if (!transport) {
    console.log("[EMAIL] Would send email to:", options.to);
    console.log("[EMAIL] Subject:", options.subject);
    return true;
  }

  try {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@in1bet.com.br";
    const fromName = process.env.SMTP_FROM_NAME || "IN1Bet";

    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("[EMAIL] Email sent successfully to:", options.to);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName?: string
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://in1bet.com.br";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 32px; font-weight: bold; font-style: italic; }
        .logo-text span:first-child { color: #f26631; }
        .logo-text span:last-child { color: #ffffff; }
        .card { background: linear-gradient(135deg, #1a1a24 0%, #0d0d14 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        h1 { color: #ffffff; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { color: #a0a0a0; line-height: 1.6; margin-bottom: 20px; }
        .button { display: block; width: 100%; background: linear-gradient(135deg, #f26631 0%, #e55520 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; text-align: center; font-size: 16px; box-sizing: border-box; }
        .link { color: #f26631; word-break: break-all; font-size: 12px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 16px; margin-top: 20px; }
        .warning p { color: #ffc107; margin: 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <span class="logo-text"><span>IN1</span><span>BET</span></span>
        </div>
        <div class="card">
          <h1>Recuperação de Senha</h1>
          <p>Olá${userName ? ` ${userName}` : ''},</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta IN1Bet. Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
          <div class="warning">
            <p>⚠️ Este link expira em 30 minutos. Se você não solicitou esta redefinição, ignore este email.</p>
          </div>
          <p style="margin-top: 20px; font-size: 14px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
          <p class="link">${resetLink}</p>
        </div>
        <div class="footer">
          <p>© 2024 IN1Bet. Todos os direitos reservados.</p>
          <p>Este email foi enviado automaticamente, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Recuperação de Senha - IN1Bet

Olá${userName ? ` ${userName}` : ''},

Recebemos uma solicitação para redefinir a senha da sua conta IN1Bet.

Clique no link abaixo para criar uma nova senha:
${resetLink}

Este link expira em 30 minutos.

Se você não solicitou esta redefinição, ignore este email.

--
IN1Bet - © 2024
  `;

  return sendEmail({
    to: email,
    subject: "Recuperação de Senha - IN1Bet",
    html,
    text,
  });
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
