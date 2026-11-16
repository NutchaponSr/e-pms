import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "อยู่ระหว่างการปรับปรุง · e-PMS",
  description: "ระบบ e-PMS อยู่ระหว่างการปรับปรุงชั่วคราว",
  robots: {
    index: false,
    follow: false,
  },
};

const MaintenancePage = () => {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <Image priority src="/logo.svg" alt="e-PMS" width={80} height={80} />
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-secondary">
          <span className="size-1.5 animate-pulse rounded-full bg-marine" />
          กำลังปรับปรุงระบบ
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-primary">
          อยู่ระหว่างการปรับปรุง
        </h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          ขณะนี้ระบบ e-PMS ปิดปรับปรุงชั่วคราว กรุณากลับมาใช้งานอีกครั้งในภายหลัง
        </p>
        <p className="mt-8 text-xs leading-5 text-tertiary">
          หากพบปัญหาการใช้งานหรือต้องการสอบถามข้อมูลเพิ่มเติมกรุณาติดต่อทีม HRM
          <br />
          ชลธิชา บุญเลี้ยง (Ext.8025) · สินีนาฏ คุลี (Ext.8207)
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
