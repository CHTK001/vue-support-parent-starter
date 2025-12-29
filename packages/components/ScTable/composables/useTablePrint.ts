/**
 * useTablePrint - 表格打印 composable
 * 支持打印预览和直接打印
 */
import { ref, type Ref } from 'vue';

/** 打印选项 */
export interface PrintOptions {
  /** 是否启用打印 */
  enabled?: boolean;
  /** 打印标题 */
  title?: string;
  /** 是否显示打印时间 */
  showTime?: boolean;
  /** 自定义样式 */
  customStyles?: string;
  /** 打印页眉 */
  header?: string;
  /** 打印页脚 */
  footer?: string;
}

/** 打印返回值 */
export interface PrintReturn {
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 是否正在打印 */
  isPrinting: Ref<boolean>;
  /** 打印表格 */
  print: (tableEl: HTMLElement | null, data?: any[], columns?: any[], options?: Partial<PrintOptions>) => void;
  /** 打印预览 */
  preview: (tableEl: HTMLElement | null, data?: any[], columns?: any[], options?: Partial<PrintOptions>) => void;
}

/**
 * 表格打印 composable
 */
export function useTablePrint(options: PrintOptions = {}): PrintReturn {
  const {
    enabled = false,
    title = '表格数据',
    showTime = true,
    customStyles = '',
    header = '',
    footer = '',
  } = options;

  const isEnabled = ref(enabled);
  const isPrinting = ref(false);

  /**
   * 生成打印 HTML
   */
  const generatePrintHtml = (
    tableEl: HTMLElement | null,
    data?: any[],
    columns?: any[],
    opts: Partial<PrintOptions> = {}
  ): string => {
    const printTitle = opts.title || title;
    const printShowTime = opts.showTime ?? showTime;
    const printHeader = opts.header || header;
    const printFooter = opts.footer || footer;
    const printCustomStyles = opts.customStyles || customStyles;

    let tableHtml = '';

    // 如果提供了数据和列配置，生成新表格
    if (data && columns) {
      const visibleColumns = columns.filter(col => col.prop && col.show !== false);
      
      tableHtml = `
        <table class="print-table">
          <thead>
            <tr>
              ${visibleColumns.map(col => `<th>${col.label || col.prop}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${visibleColumns.map(col => `<td>${row[col.prop] ?? ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (tableEl) {
      // 使用现有表格元素
      const tableClone = tableEl.cloneNode(true) as HTMLElement;
      // 移除不需要打印的元素
      tableClone.querySelectorAll('.el-table__fixed, .el-table__fixed-right').forEach(el => el.remove());
      tableHtml = tableClone.outerHTML;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${printTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            padding: 20px;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .print-time {
            font-size: 12px;
            color: #666;
          }
          .print-custom-header {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .print-table, table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .print-table th, .print-table td,
          table th, table td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          .print-table th, table th {
            background: #f5f5f5;
            font-weight: bold;
          }
          .print-table tr:nth-child(even), table tr:nth-child(even) {
            background: #fafafa;
          }
          .print-footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
          /* 隐藏 ElementPlus 特定样式 */
          .el-table__header-wrapper,
          .el-table__body-wrapper {
            overflow: visible !important;
          }
          .el-scrollbar__wrap {
            overflow: visible !important;
          }
          .cell {
            overflow: visible !important;
            white-space: normal !important;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
          ${printCustomStyles}
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">${printTitle}</div>
          ${printShowTime ? `<div class="print-time">打印时间：${new Date().toLocaleString()}</div>` : ''}
        </div>
        ${printHeader ? `<div class="print-custom-header">${printHeader}</div>` : ''}
        <div class="print-content">
          ${tableHtml}
        </div>
        ${printFooter ? `<div class="print-footer">${printFooter}</div>` : ''}
      </body>
      </html>
    `;
  };

  /**
   * 打印表格
   */
  const print = (
    tableEl: HTMLElement | null,
    data?: any[],
    columns?: any[],
    opts: Partial<PrintOptions> = {}
  ): void => {
    if (!isEnabled.value) return;
    isPrinting.value = true;

    try {
      const html = generatePrintHtml(tableEl, data, columns, opts);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('[useTablePrint] Failed to open print window');
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();
      
      // 等待内容加载完成后打印
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    } finally {
      isPrinting.value = false;
    }
  };

  /**
   * 打印预览
   */
  const preview = (
    tableEl: HTMLElement | null,
    data?: any[],
    columns?: any[],
    opts: Partial<PrintOptions> = {}
  ): void => {
    if (!isEnabled.value) return;

    const html = generatePrintHtml(tableEl, data, columns, opts);
    
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      console.error('[useTablePrint] Failed to open preview window');
      return;
    }

    previewWindow.document.write(html);
    previewWindow.document.close();
  };

  return {
    isEnabled,
    isPrinting,
    print,
    preview,
  };
}

export default useTablePrint;
