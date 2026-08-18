# Approval model — design

Date: 2026-08-18

## Goal

แยกสายบังคับบัญชาออกจาก `Employee` เป็น model `Approval` ตามข้อมูลใน `src/data/approval.csv`  
`Task` ยังเก็บ snapshot ของ checker/approver ตอนสร้างงาน เพื่อไม่ให้การเปลี่ยนสายกระทบงานที่เสร็จแล้ว

## Decision

แนวทาง A: `Approval` เป็น source of truth, `Task` ยัง snapshot `checkerId` / `approverId` เหมือนเดิม

ไม่เลือก:

- B (Task ผูก FK ไป Approval) — เปลี่ยนสายจะย้ายงานค้างทั้งหมดทันที และประวัติสายตอนประเมินหาย
- C (Approval เป็น step ต่อ Task) — refactor ใหญ่เกินความจำเป็นของสาย 2 ขั้นคงที่

## Data model

```prisma
model Approval {
  id         String   @id @default(cuid())
  employeeId String   @unique
  checkerId  String?
  approverId String

  employee Employee  @relation("ApprovalOwner", fields: [employeeId], references: [id], onDelete: Cascade)
  checker  Employee? @relation("ApprovalChecker", fields: [checkerId], references: [id], onDelete: SetNull)
  approver Employee  @relation("ApprovalApprover", fields: [approverId], references: [id], onDelete: Restrict)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("approval")
}
```

### Employee

ตัด `checkerId` / `approverId` และ self-relation `ApprovalChecker` / `ApprovalApprover` ออก

เพิ่ม:

- `approval Approval?` — สายของตัวเอง (`ApprovalOwner`)
- `checkerFor Approval[]` — คนที่ตัวเองเป็น checker ให้
- `approverFor Approval[]` — คนที่ตัวเองเป็น approver ให้

### Task

ไม่เปลี่ยน schema  
ยังมี `checkerId?`, `approverId`, `checkedAt`, `approvedAt` และ relation `Checker` / `Approver` ไป `Employee`

ไม่มี FK จาก Task ไป Approval

### Rules

- หนึ่งพนักงานมี Approval ได้มากสุดหนึ่งแถว (`employeeId` unique)
- `approverId` บังคับมี
- `checkerId` เป็น optional (หลายแถวใน CSV ไม่มี checker)
- ห้ามตั้ง `employeeId` เป็น checker หรือ approver ของตัวเอง
- ลบ Employee เจ้าของสาย → ลบ Approval ของคนนั้น (`Cascade`)
- ลบคนที่เป็น checker ของคนอื่น → `checkerId` เป็น null (`SetNull`)
- ลบคนที่เป็น approver ของคนอื่น → ห้ามลบถ้ายังถูกอ้าง (`Restrict`) เพื่อไม่ให้สายหายเงียบๆ

## Data flow

### Seed

`src/seeds/seed-approval.ts` อ่าน `src/data/approval.csv` แล้ว `upsert` ลง `Approval` ตาม `employeeId`

แถวที่ employee, checker, หรือ approver ไม่มีในตาราง employee → skip และ warn เหมือนเดิม

### สร้าง Task

`merit.createTask` และ `kpi.createTask` อ่าน `db.approval.findUnique({ where: { employeeId } })`

- ไม่มีแถว หรือไม่มี `approverId` → `NOT_FOUND` ข้อความ `"Approval chain not configured for this employee"`
- มีแถว → copy `checkerId` / `approverId` ลง Task ตอน create (snapshot)

### Admin แก้สาย

`admin.updateApprovalChain` เขียนที่ `Approval` (upsert) ไม่แตะ Employee

จากนั้นใน transaction เดียว:

1. อัปเดต Task ที่ `ownerId` ตรงกันและ `status != COMPLETED` ให้ใช้สายใหม่
2. ถ้าสายใหม่ไม่มี checker และ Task ค้างที่ `WAITING_APPROVER_1` → เลื่อนเป็น `WAITING_APPROVER_2`

กฎ validation เดิมยังใช้: ห้ามตั้งตัวเอง, employee ที่อ้างถึงต้องมีใน DB

### Tracker

`tasks.getManyByYear` หาลูกน้องจาก `Approval` ไม่ใช่ field บน Employee:

```ts
db.approval.findMany({
  where: {
    OR: [{ checkerId: employee.id }, { approverId: employee.id }],
  },
  select: { employeeId: true },
})
```

### Workflow / permissions

ไม่เปลี่ยน  
`tasks.permissions` และสถานะ `WAITING_APPROVER_1` / `WAITING_APPROVER_2` / `COMPLETED` ยังอ่าน snapshot บน Task

### Admin UI

`chain-section.tsx` ยังแก้สายได้เหมือนเดิม  
`getEmployees` include `approval` แล้ว map `checkerId` / `approverId` จาก `employee.approval` ให้ UI เดิมใช้ได้โดยไม่ต้องเปลี่ยนโครงฟอร์มมาก

## Migration

1. สร้างตาราง `approval`
2. copy แถวจาก Employee ที่มี `approverId` ไปเป็น Approval (`employeeId`, `checkerId`, `approverId`)
3. drop `checkerId` / `approverId` และ FK ที่เกี่ยวข้องบน Employee

Task ที่มีอยู่ไม่ต้อง migrate — snapshot อยู่แล้ว

หลัง migrate ให้รัน `seed-approval.ts` ได้ถ้าต้องการ sync จาก CSV อีกรอบ (upsert ทับ Approval ไม่แตะ Task ที่เสร็จแล้ว)

## Error handling

| กรณี | พฤติกรรม |
|---|---|
| ไม่มี Approval / ไม่มี approver ตอนสร้าง Task | `NOT_FOUND` |
| ตั้งตัวเองเป็น checker หรือ approver | `BAD_REQUEST` |
| employee ที่อ้างถึงไม่มีใน DB (admin) | `NOT_FOUND` |
| employee/checker/approver ไม่มีใน DB (seed) | skip + warn |
| ลบ Employee เจ้าของสาย | ลบ Approval ตาม |
| ลบคนที่เป็น checker ของคนอื่น | `checkerId` เป็น null |
| ลบคนที่เป็น approver ของคนอื่น | ลบไม่ได้จนกว่าจะย้ายสาย |

## Files ที่ต้องแก้

- `prisma/schema.prisma`
- migration ใหม่ (create `approval`, copy data, drop columns บน employee)
- `src/seeds/seed-approval.ts`
- `src/modules/merit/server/procedure.ts` — `createTask`
- `src/modules/kpi/server/procedure.ts` — `createTask`
- `src/modules/admin/server/procedure.ts` — `getEmployees`, `updateApprovalChain`
- `src/modules/tasks/server/procedure.ts` — `getManyByYear`
- `src/modules/admin/ui/components/chain-section.tsx` ถ้า type ของ `getEmployees` เปลี่ยน

ไม่ต้องแก้: `src/modules/tasks/permissions.ts`, Status enum, merit/kpi evaluation screens

## Out of scope

- สายอนุมัติมากกว่า 2 ขั้น
- audit log / ประวัติการตีกลับ
- FK จาก Task ไป Approval
- เก็บสายแยกต่อปี
- เปลี่ยน workflow หรือ permission ที่อิง snapshot บน Task
