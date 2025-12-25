import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.NODE_ENV === "production" ? "smtp.office365.com" : "smtp.gmail.com",
  port: process.env.NODE_ENV === "production" ? 587 : 465,
  secure: process.env.NODE_ENV === "production" ? false : true, 
  auth: {
    user: process.env.NODE_ENV === "production" ? process.env.NODEMAILER_USER_PROD : process.env.NODEMAILER_USER_DEV,
    pass: process.env.NODE_ENV === "production" ? process.env.NODEMAILER_PASSWORD_PROD : process.env.NODEMAILER_PASSWORD_DEV,
  },
});
