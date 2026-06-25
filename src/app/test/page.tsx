"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { testSendStartEmail } from "@/actions/test-send-start-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MailerMode } from "@/lib/nodemailer";

export default function TestPage() {
  const [to, setTo] = useState("pondpopza5@gmail.com");
  const [error, setError] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<MailerMode | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSend = (mode: MailerMode) => {
    setError(null);
    setPendingMode(mode);

    startTransition(async () => {
      try {
        await testSendStartEmail({ to, mode });
        toast.success(`ส่งอีเมลสำเร็จ (${mode === "prod" ? "Prod" : "Dev"})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "ส่งอีเมลไม่สำเร็จ";
        setError(message);
        toast.error(message);
      } finally {
        setPendingMode(null);
      }
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-primary">Test Start Workflow Email</h1>
          <p className="text-sm text-muted-foreground">
            ทดสอบส่งอีเมลแบบเดียวกับตอน Start Workflow (Hello World)
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="to" className="text-sm font-medium text-primary">
            ส่งถึง (To)
          </label>
          <Input
            id="to"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            className="w-full"
            disabled={isPending || !to}
            onClick={() => handleSend("prod")}
          >
            {pendingMode === "prod" ? "กำลังส่ง..." : "ส่งผ่าน Prod (smtp.office365.com)"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isPending || !to}
            onClick={() => handleSend("dev")}
          >
            {pendingMode === "dev" ? "กำลังส่ง..." : "ส่งผ่าน Dev (smtp.gmail.com)"}
          </Button>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Prod: NODEMAILER_USER_PROD / NODEMAILER_PASSWORD_PROD</p>
          <p>Dev: NODEMAILER_USER_DEV / NODEMAILER_PASSWORD_DEV</p>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
      </div>
    </main>
  );
}
