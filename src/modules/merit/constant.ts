import { ExportColumn } from "@/lib/utils";

export const competencyLevels = [
  {
    label: "Level 1",
    content: "สามารถทำ/แสดงออก/ได้ผลลัพธ์ที่คาดหวังน้อยกว่า 60%",
  },
  {
    label: "Level 2",
    content: "สามารถทำ/แสดงออก/ได้ผลลัพธ์ที่คาดหวัง 60% - 69%",
  },
  {
    label: "Level 3",
    content: "สามารถทำ/แสดงออก/ได้ผลลัพธ์ที่คาดหวัง 70% - 79%",
  },
  {
    label: "Level 4",
    content: "สามารถทำ/แสดงออก/ได้ผลลัพธ์ที่คาดหวัง 80% - 89%",
  },
  {
    label: "Level 5",
    content: "สามารถทำ/แสดงออก/ได้ผลลัพธ์ที่คาดหวัง 90% ขึ้นไป",
  },
];

export const cultureLevels = [
  {
    label: "Level 1",
    content: "เข้าใจความหมายและอธิบาย Culture ข้อนั้นๆได้",
  },
  {
    label: "Level 2",
    content: "เริ่ม/ทดลองปฏิบัติ แสดงออกตามพฤติกรรมที่คาดหวังของ Culture ข้อนั้นๆ",
  },
  {
    label: "Level 3",
    content: "ปฏิบัติตาม/แสดงออกพฤติกรรมที่คาดหวังของ Culture ข้อนั้นๆอยู่เสมอ",
  },
  {
    label: "Level 4",
    content: "ชักชวนพนักงานคนอื่นปฏิบัติตามพฤติกรรมที่คาดหวังของ Culture ข้อนั้นๆ",
  },
  {
    label: "Level 5",
    content: "เป็นแบบอย่างให้พนักงานคนอื่นปฏิบัติตามพฤติกรรมที่คาดหวังของ Culture ข้อนั้นๆ",
  },
];

export const columns: ExportColumn[] = [
  {
    key: "employeeId",
    header: "รหัสพนักงาน",
  },
  {
    key: "employeeName",
    header: "ชื่อพนักงาน",
  },
  {
    key: "year",
    header: "Year",
  },
  {
    key: "period",
    header: "Period",
  },
  {
    key: "type",
    header: "Type",
  },
  {
    key: "performer",
    header: "Performer",
  },
  {
    key: "name",
    header: "ชื่อ",
  },
  {
    key: "detail",
    header: "Detail",
  },
  {
    key: "owner",
    header: "Owner",
  },
  {
    key: "checker",
    header: "Checker",
  },
  {
    key: "approver",
    header: "Approver",
  },
  {
    key: "percentage",
    header: "Percentage (%)",
  },
]