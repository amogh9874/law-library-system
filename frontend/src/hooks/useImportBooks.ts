import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ImportRowError {
  rowNumber: number;
  title?: string;
  error: string;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedRows: ImportRowError[];
  unrecognizedHeaders: string[];
}

export function useImportBooks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileBase64: string) => {
      const { data } = await api.post<ImportResult>("/books/import", { fileBase64 });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      queryClient.invalidateQueries({ queryKey: ["publishers"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["shelves"] });
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    },
  });
}

export async function downloadImportTemplate() {
  const response = await api.get("/books/import/template", { responseType: "blob" });
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "book-import-template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}
