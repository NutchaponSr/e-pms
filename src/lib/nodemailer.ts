import nodemailer from "nodemailer";

export type MailerMode = "prod" | "dev";

const mailerEnvKeys: Record<MailerMode, { user: string; pass: string }> = {
  prod: {
    user: "NODEMAILER_USER_PROD",
    pass: "NODEMAILER_PASSWORD_PROD",
  },
  dev: {
    user: "NODEMAILER_USER_DEV",
    pass: "NODEMAILER_PASSWORD_DEV",
  },
};

export const transporterProd = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.NODEMAILER_USER_PROD,
    pass: process.env.NODEMAILER_PASSWORD_PROD,
  },
});

export const transporterDev = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER_DEV,
    pass: process.env.NODEMAILER_PASSWORD_DEV,
  },
});

export const transporter = transporterProd;

export function getTransporter(mode: MailerMode = "prod") {
  return mode === "dev" ? transporterDev : transporterProd;
}

export function getMailerFrom(mode: MailerMode = "prod") {
  return mode === "dev"
    ? process.env.NODEMAILER_USER_DEV
    : process.env.NODEMAILER_USER_PROD;
}

export function assertMailerConfig(mode: MailerMode) {
  const keys = mailerEnvKeys[mode];
  const user = process.env[keys.user];
  const pass = process.env[keys.pass];

  if (!user || !pass) {
    throw new Error(
      `ยังไม่ได้ตั้งค่า ${keys.user} หรือ ${keys.pass} ใน .env`,
    );
  }
}

export function formatSmtpError(mode: MailerMode, error: unknown) {
  const message = error instanceof Error ? error.message : "ส่งอีเมลไม่สำเร็จ";

  if (message.includes("535") || message.includes("Authentication unsuccessful")) {
    if (mode === "prod") {
      return [
        "Prod (Office365): login ไม่ผ่าน",
        "ตรวจสอบ NODEMAILER_USER_PROD / NODEMAILER_PASSWORD_PROD",
        "และเปิด SMTP AUTH ให้ mailbox ใน Microsoft 365 Admin",
        "ถ้ามี MFA ต้องใช้ App Password",
      ].join(" • ");
    }

    return [
      "Dev (Gmail): login ไม่ผ่าน",
      "ตรวจสอบ NODEMAILER_USER_DEV / NODEMAILER_PASSWORD_DEV",
      "และใช้ Gmail App Password",
    ].join(" • ");
  }

  return message;
}
