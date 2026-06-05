import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.NODEMAILER_USER_PROD,
    pass: process.env.NODEMAILER_PASSWORD_PROD,
  },
});
