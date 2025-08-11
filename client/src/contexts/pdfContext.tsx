import React, { createContext, useContext, useState } from "react";

export type PDFFile = {
  id: string;
  name: string;
  size: number; // in bytes
  uploadDate: string;
  pageCount?: number;
  file: File; // ✅ store the actual File object
};

type PDFsContextType = {
  files: PDFFile[];
  setFiles: React.Dispatch<React.SetStateAction<PDFFile[]>>;
};

const PDFsContext = createContext<PDFsContextType | undefined>(undefined);

export const PDFsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  return (
    <PDFsContext.Provider value={{ files, setFiles }}>
      {children}
    </PDFsContext.Provider>
  );
};

export const usePDFs = () => {
  const context = useContext(PDFsContext);
  if (!context) {
    throw new Error("usePDFs must be used within a PDFsProvider");
  }
  return context;
};
