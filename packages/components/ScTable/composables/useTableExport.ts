/**
 * useTableExport - 表格数据导出 composable
 * 支持导出 Excel、CSV、JSON 格式
 */
import { ref, type Ref } from 'vue';

/** 导出类型 */
export type ExportType = 'excel' | 'csv' | 'json';

/** 导出选项 */
export interface ExportOptions {
  /** 是否启用导出 */
  enabled?: boolean;
  /** 支持的导出类型 */
  types?: ExportType[];
  /** 文件名（不含扩展名） */
  filename?: string;
  /** 是否导出全部数据（否则只导出当前页） */
  exportAll?: boolean;
  /** 要导出的列（为空则导出所有列） */
  columns?: string[];
  /** 列标题映射 */
  columnTitles?: Record<string, string>;
}

/** 导出返回值 */
export interface ExportReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 是否正在导出 */
  isExporting: Ref<boolean>;
  /** 支持的导出类型 */
  exportTypes: Ref<ExportType[]>;
  /** 导出为 Excel */
  exportToExcel: (data: any[], options?: Partial<ExportOptions>) => Promise<void>;
  /** 导出为 CSV */
  exportToCsv: (data: any[], options?: Partial<ExportOptions>) => Promise<void>;
  /** 导出为 JSON */
  exportToJson: (data: any[], options?: Partial<ExportOptions>) => Promise<void>;
  /** 通用导出方法 */
  exportData: (type: ExportType, data: any[], options?: Partial<ExportOptions>) => Promise<void>;
}

/**
 * 表格导出 composable
 */
export function useTableExport(options: ExportOptions = {}): ExportReturn {
  const {
    enabled = false,
    types = ['excel', 'csv', 'json'],
    filename = 'table-data',
    columns = [],
    columnTitles = {},
  } = options;

  const isEnabled = ref(enabled);
  const isExporting = ref(false);
  const exportTypes = ref<ExportType[]>(types);

  /**
   * 过滤并格式化数据
   */
  const formatData = (data: any[], opts: Partial<ExportOptions>): any[] => {
    const cols = opts.columns || columns;
    const titles = opts.columnTitles || columnTitles;

    if (cols.length === 0) {
      // 导出所有列，但使用标题映射
      return data.map(row => {
        const newRow: Record<string, any> = {};
        Object.keys(row).forEach(key => {
          const title = titles[key] || key;
          newRow[title] = row[key];
        });
        return newRow;
      });
    }

    // 只导出指定列
    return data.map(row => {
      const newRow: Record<string, any> = {};
      cols.forEach(col => {
        const title = titles[col] || col;
        newRow[title] = row[col];
      });
      return newRow;
    });
  };

  /**
   * 下载文件
   */
  const downloadFile = (content: string | Blob, filename: string, mimeType: string): void => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 导出为 Excel (使用简单的 HTML 表格格式)
   */
  const exportToExcel = async (data: any[], opts: Partial<ExportOptions> = {}): Promise<void> => {
    if (!isEnabled.value) return;
    isExporting.value = true;

    try {
      const formattedData = formatData(data, opts);
      const name = opts.filename || filename;

      if (formattedData.length === 0) {
        console.warn('[useTableExport] No data to export');
        return;
      }

      // 获取表头
      const headers = Object.keys(formattedData[0]);

      // 构建 HTML 表格
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8"></head>
        <body>
        <table border="1">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
      `;

      formattedData.forEach(row => {
        html += '<tr>';
        headers.forEach(h => {
          const value = row[h] ?? '';
          html += `<td>${value}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table></body></html>';

      downloadFile(html, `${name}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    } finally {
      isExporting.value = false;
    }
  };

  /**
   * 导出为 CSV
   */
  const exportToCsv = async (data: any[], opts: Partial<ExportOptions> = {}): Promise<void> => {
    if (!isEnabled.value) return;
    isExporting.value = true;

    try {
      const formattedData = formatData(data, opts);
      const name = opts.filename || filename;

      if (formattedData.length === 0) {
        console.warn('[useTableExport] No data to export');
        return;
      }

      const headers = Object.keys(formattedData[0]);
      
      // 转义 CSV 值
      const escapeValue = (val: any): string => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      let csv = '\uFEFF'; // BOM for UTF-8
      csv += headers.map(escapeValue).join(',') + '\n';
      
      formattedData.forEach(row => {
        csv += headers.map(h => escapeValue(row[h])).join(',') + '\n';
      });

      downloadFile(csv, `${name}.csv`, 'text/csv;charset=utf-8');
    } finally {
      isExporting.value = false;
    }
  };

  /**
   * 导出为 JSON
   */
  const exportToJson = async (data: any[], opts: Partial<ExportOptions> = {}): Promise<void> => {
    if (!isEnabled.value) return;
    isExporting.value = true;

    try {
      const formattedData = formatData(data, opts);
      const name = opts.filename || filename;

      const json = JSON.stringify(formattedData, null, 2);
      downloadFile(json, `${name}.json`, 'application/json;charset=utf-8');
    } finally {
      isExporting.value = false;
    }
  };

  /**
   * 通用导出方法
   */
  const exportData = async (
    type: ExportType,
    data: any[],
    opts: Partial<ExportOptions> = {}
  ): Promise<void> => {
    switch (type) {
      case 'excel':
        return exportToExcel(data, opts);
      case 'csv':
        return exportToCsv(data, opts);
      case 'json':
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
