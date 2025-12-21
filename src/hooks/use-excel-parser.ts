"use client";

import { useState } from "react";

import { parseExcel, parseAllSheets, getSheetNames } from "@/actions/parse-excel";

type ExcelData = {
  [key: string]: any;
}[];

export const useExcelParser = () => {
  const [isParsingFile, setIsParsingFile] = useState(false);
  
  const handleFileParsing = async (file: File, sheetIndex?: number): Promise<ExcelData> => {
    setIsParsingFile(true);
    try {
      const parsedData = await parseExcel(file, sheetIndex);
      return parsedData;
    } catch (error) {
      throw error;
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleAllSheetsParsing = async (file: File): Promise<Record<string, ExcelData>> => {
    setIsParsingFile(true);
    try {
      const parsedData = await parseAllSheets(file);
      return parsedData;
    } catch (error) {
      throw error;
    } finally {
      setIsParsingFile(false);
    }
  };

  const getFileSheetNames = async (file: File): Promise<string[]> => {
    try {
      return await getSheetNames(file);
    } catch (error) {
      throw error;
    }
  };

  return {
    isParsingFile,
    handleFileParsing,
    handleAllSheetsParsing,
    getFileSheetNames,
  };
};