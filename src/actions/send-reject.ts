"use server";

import { transporter } from "@/lib/nodemailer";

export const sendReject = async ({
  to,
  cc,
  subject,
  employeeName,
  documentType,
  checkedBy,
  url,
}: {
  to: string,
  cc?: string[],
  subject: string,
  checkerName?: string,
  approverName: string,
  employeeName: string,
  documentType: string,
  checkedAt?: string,
  status: string,
  url: string,
  checkedBy?: string,
}) => {
  await transporter.sendMail({
    from: process.env.NODEMAILER_USER,
    to,
    cc: cc || undefined,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333333;">
          <!-- Header -->
          <div style="margin-bottom: 20px;">
            <p style="margin: 5px 0; color: #666666; font-size: 14px;">To: ${to}</p>
            ${cc ? `<p style="margin: 5px 0; color: #666666; font-size: 14px;">CC: ${cc.join(', ')} (เพื่อยืนยันว่าส่งแล้ว)</p>` : ''}
            <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Subject: ${subject}</strong></p>
          </div>

          <!-- Salutation -->
          <p style="margin: 20px 0; font-size: 16px; color: #333333;">เรียน คุณ${employeeName},</p>

          <!-- Body -->
          <p style="margin: 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
            เอกสาร ${documentType} ของท่าน ถูกส่งคืน (Declined) เพื่อให้แก้ไขข้อมูล โดยผู้พิจารณา: ${checkedBy || `-`}
          </p>

          <p style="margin: 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
            เหตุผลการส่งคืน (Reason / Comment): ข้อมูลไม่ถูกต้องหรือไม่ครบถ้วน
          </p>

          <!-- Call to Action -->
          <p style="margin: 30px 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
            กรุณาแก้ไขข้อมูลให้ถูกต้องและกดส่งเอกสารใหม่อีกครั้ง
          </p>

          <!-- Button -->
          <div style="text-align: start; margin: 30px 0;">
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
              ดูรายละเอียด (View Details)
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}