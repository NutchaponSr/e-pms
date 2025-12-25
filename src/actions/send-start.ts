"use server";

import { transporter } from "@/lib/nodemailer";

export const sendStart = async ({
  to,
  cc,
  subject,
  body,
  checkerName,
  employeeName,
  documentType,
  submitDate,
  status,
  url,
}: {
  to: string,
  cc?: string[],
  subject: string,
  body: string,
  checkerName: string,
  employeeName: string,
  documentType: string,
  submitDate: string,
  status: string,
  url: string,
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
          <p style="margin: 20px 0; font-size: 16px; color: #333333;">เรียน คุณ${checkerName},</p>

          <!-- Body -->
          <p style="margin: 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
            ${body}
          </p>

          <!-- Details Table -->
          <div style="margin: 30px 0; background-color: #f9f9f9; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px; color: #333333; font-weight: bold; border-bottom: 1px solid #ddd;">รายละเอียด (Details)</th>
                  <th style="text-align: left; padding: 10px; color: #333333; font-weight: bold; border-bottom: 1px solid #ddd;">ข้อมูล (Information)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px 10px; color: #333333; font-weight: bold; border-bottom: 1px solid #ddd;">ชื่อพนักงาน (Employee):</td>
                  <td style="padding: 12px 10px; color: #333333; border-bottom: 1px solid #ddd;">${employeeName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 10px; color: #333333; font-weight: bold; border-bottom: 1px solid #ddd;">ประเภทเอกสาร (Document):</td>
                  <td style="padding: 12px 10px; color: #333333; border-bottom: 1px solid #ddd;">${documentType}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 10px; color: #333333; font-weight: bold; border-bottom: 1px solid #ddd;">สถานะ (Current Status):</td>
                  <td style="padding: 12px 10px; color: #333333; border-bottom: 1px solid #ddd;">${status}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 10px; color: #333333; font-weight: bold;">วันที่ส่ง (Submitted Date):</td>
                  <td style="padding: 12px 10px; color: #333333;">${submitDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Call to Action -->
          <p style="margin: 30px 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
            กรุณาคลิกปุ่มด้านล่างเพื่อเข้าสู่ระบบเพื่อตรวจสอบและพิจารณา
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