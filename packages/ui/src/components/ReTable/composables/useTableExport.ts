/**
 * useTableExport - 表格数据导出 composable
 * 
 * 支持导出 Excel、CSV、JSON 格式
 */
import { ref, type Ref } from "vue";

export type ExportType = "excel" | "csv" | "json";

export interface ExportOptions {
  enabled?: boolean;
  types?: ExportType[];
  filename?: string;
  columns?: string[];
  columnTitles?: Record<string, string>;
}

export interface ExportReturn {
  isEnabled: Ref<boolean>;
  isExporting: Ref<boolean>;
  exportTypes: Ref<ExportType[]>;
  exportToExcel: (data: any[], options?: Partial<ExportOptions>) => Promise<void>;
  exportToCsv: (data: any[], options?: Partial<ExportOptions>) => Promise<void>;
  exportToJson: (data: any[], options?: Partial<ExportOptions>) => Promise<void>;
  exportData: (type: ExportType, data: any[], options?: Partial<ExportOptions>) => Promise<void>;
}

export function useTableExport(options: ExportOptions = {}): ExportReturn {
  const { enabled = false, types = ["excel", "csv", "json"], filename = "table-data", columns = [], columnTitles = {} } = options;

  const isEnabled = ref(enabled);
  const isExporting = ref(false);
  const exportTypes = ref<ExportType[]>(types);

  const formatData = (data: any[], opts: Partial<ExportOptions>): any[] => {
    const cols = opts.columns || columns;
    const titles = opts.columnTitles || columnTitles;

    if (cols.length === 0) {
      return data.map(row => {
        const newRow: Record<string, any> = {};
        Object.keys(row).forEach(key => {
          const title = titles[key] || key;
          newRow[title] = row[key];
        });
        return newRow;
      });
    }

    return data.map(row => {
      const newRow: Record<string, any> = {};
      cols.forEach(col => {
        const title = titles[col] || col;
        newRow[title] = row[col];
      });
      return newRow;
    });
  };

  const downloadFile = (content: string | Blob, filename: string, mimeType: string): void => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async (data: any[], opts: Partial<ExportOptions> = {}): Promise<void> => {
    if (!isEnabled.value) return;
    isExporting.value = true;

    try {
      const formattedData = formatData(data, opts);
      const name = opts.filename || filename;

      if (formattedData.length === 0) {
        console.warn("[useTableExport] No data to export");
        return;
      }

      const headers = Object.keys(formattedData[0]);

      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8"></head>
        <body>
        <table border="1">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
      `;

      formattedData.forEach(row => {
        html += "<tr>";
        headers.forEach(h => {
          const value = row[h] ?? "";
          html += `<td>${value}</td>`;
        });
        html += "</tr>";
      });

      html += "</tbody></table></body></html>";

      downloadFile(html, `${name}.xls`, "application/vnd.ms-excel;charset=utf-8");
    } finally {
      isExporting.value = false;
    }
  };

  const exportToCsv = async (data: any[], opts: Partial<ExportOptions> = {}): Promise<void> => {
    if (!isEnabled.value) return;
    isExporting.value = true;

    try {
      const formattedData = formatData(data, opts);
      const name = opts.filename || filename;

      if (formattedData.length === 0) {
        console.warn("[useTableExport] No data to export");
        return;
      }

      const headers = Object.keys(formattedData[0]);

      const escapeValue = (val: any): string => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      let csv = "\uFEFF";
      csv += headers.map(escapeValue).join(",") + "\n";

      formattedData.forEach(row => {
        csv += headers.map(h => escapeValue(row[h])).join(",") + "\n";
      });

      downloadFile(csv, `${name}.csv`, "text/csv;charset=utf-8");
    } finally {
      isExporting.value = false;
    }
  };

  const exportToJson = async (data: any[], opts: Partial<ExportOptions> = {}): Promise<void> => {
    if (!isEnabled.value) return;
    isExporting.value = true;

    try {
      const formattedData = formatData(data, opts);
      const name = opts.filename || filename;

      const json = JSON.stringify(formattedData, null, 2);
      downloadFile(json, `${name}.json`, "application/json;charset=utf-8");
    } finally {
      isExporting.value = false;
    }
  };

  const exportData = async (type: ExportType, data: any[], opts: Partial<ExportOptions> = {}): Promise<void> => {
    switch (type) {
      case "excel":
        return exportToExcel(data, opts);
      case "csv":
        return exportToCsv(data, opts);
      case "json":
        return exportToJson(data, opts);
      default:
        console.warn(`[useTableExport] Unknown export type: ${type}`);
    }
  };

  return {
    isEnabled,
    isExporting,
    exportTypes,
    exportToExcel,
    exportToCsv,
    exportToJson,
    exportData,
  };
}

export default useTableExport;