"use server";

import { format } from "date-fns";
import { sendStart } from "@/actions/send-start";
import type { MailerMode } from "@/lib/nodemailer";

export const testSendStartEmail = async ({
  to,
  mode,
}: {
  to: string;
  mode: MailerMode;
}) => {
  const app = "KPI";
  const ownerName = "Hello World Employee";
  const checkerName = "Hello World Checker";
  const status = "รอการอนุมัติจากผู้ตรวจสอบ (Waiting Approver 1)";
  const modeLabel = mode === "prod" ? "PROD (Office365)" : "DEV (Gmail)";

  await sendStart({
    to,
    cc: process.env.NODE_ENV === "production" ? ["employee@example.com"] : [],
    subject: `[E-PMS][${modeLabel}] Action Required: ตรวจสอบและอนุมัติเอกสาร ${app} - ${ownerName}`,
    body: "มีเอกสารจากระบบประเมินผลการปฏิบัติงาน เข้ามาในระบบเพื่อรอการตรวจสอบและพิจารณา อนุมัติจากท่าน โดยมีรายละเอียดดังนี้:",
    checkerName,
    employeeName: ownerName,
    documentType: app,
    submitDate: format(new Date(), "yyyy-MM-dd"),
    status,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/test`,
    mode,
  });
};
