import nodemailer from "nodemailer";

export type MailerMode = "prod" | "dev";

export const transporterProd = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER_PROD,
    pass: process.env.NODEMAILER_PASSWORD_PROD,
  },
});

export const transporterDev = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
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
