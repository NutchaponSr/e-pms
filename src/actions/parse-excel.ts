/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import * as XLSX from "xlsx";

type ExcelData = {
  [key: string]: any;
}[];

export const getSheetNames = async (file: File): Promise<string[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    return workbook.SheetNames;
  } catch (error) {
    throw new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const parseAllSheets = async (file: File): Promise<Record<string, ExcelData>> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });

    const allSheetsData: Record<string, ExcelData> = {};

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        const formattedData = rows.map((row, index) => {
          const rowData: { [key: string]: any } = { _rowIndex: index + 2, _sheetName: sheetName };
          headers.forEach((header, colIndex) => {
            rowData[header || `Column ${colIndex + 1}`] = row[colIndex] || "";
          });
          return rowData;
        });

        allSheetsData[sheetName] = formattedData;
      } else {
        allSheetsData[sheetName] = [];
      }
    });

    return allSheetsData;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const parseExcel = async (file: File, sheetIndex?: number): Promise<ExcelData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const workbook = XLSX.read(data, { type: "array" });

    // Use specified sheet index or default to first sheet
    const targetSheetIndex = sheetIndex ?? 0;
    const sheetName = workbook.SheetNames[targetSheetIndex];

    if (!sheetName) {
      throw new Error(`Sheet at index ${targetSheetIndex} not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length > 0) {
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      const formattedData = rows.map((row, index) => {
        const rowData: { [key: string]: any } = { _rowIndex: index + 2 };
        headers.forEach((header, colIndex) => {
          rowData[header || `Column ${colIndex + 1}`] = row[colIndex] || "";
        });

        return rowData;
      });

      return formattedData;
    } else {
      return [];
    }
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}