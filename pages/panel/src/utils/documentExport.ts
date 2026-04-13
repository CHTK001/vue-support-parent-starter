import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { JdbcTableStructure, PanelDatabaseDocumentView } from "../api";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const normalizeFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, "_");
const toParagraphs = (content: string) =>
  String(content || "")
    .split("\n")
    .map(line => new Paragraph(line || " "));

const buildStructureMarkdown = (
  structure: JdbcTableStructure,
  documentContent: string,
  aiContent: string,
) => {
  const lines = [
    `# ${structure.tableName || "panel-document"} 数据表文档`,
    "",
    `- Catalog: ${structure.catalogName || "-"}`,
    `- Schema: ${structure.schemaName || "-"}`,
    `- 主键: ${structure.primaryKeys.join(", ") || "-"}`,
    "",
    "## 字段定义",
    "",
    "| 字段 | 类型 | 长度 | 注释 |",
    "| --- | --- | --- | --- |",
    ...(structure.columns || []).map(column =>
      [
        String(column.name || "-"),
        String(column.type || "-"),
        String(column.size ?? "-"),
        String(column.comment || "-"),
      ].join(" | "),
    ).map(line => `| ${line} |`),
    "",
    "## 结构说明",
    "",
    documentContent || "-",
    "",
    "## AI 备注",
    "",
    aiContent || "-",
    "",
  ];
  return lines.join("\n");
};

const buildDatabaseDocumentMarkdown = (document: PanelDatabaseDocumentView) => {
  const lines = [
    `# ${document.panelCatalogName || "未命名数据库"} 数据库文档`,
    "",
    `- Schema 数量: ${document.panelSchemaCount || 0}`,
    `- 表数量: ${document.panelTableCount || 0}`,
    `- 生成时间: ${document.panelGeneratedAt || "-"}`,
    "",
  ];

  (document.panelTables || []).forEach(table => {
    lines.push(`## ${table.panelTableName}`);
    lines.push("");
    lines.push(`- Schema: ${table.panelSchemaName || "default"}`);
    lines.push(`- 备注: ${table.panelTableComment || "-"}`);
    lines.push(`- 主键: ${(table.panelPrimaryKeys || []).join(", ") || "-"}`);
    lines.push("");
    lines.push("| 字段 | 类型 | 长度 | 允许空 | 默认值 | 备注 |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    (table.panelColumns || []).forEach(column => {
      lines.push(
        `| ${String(column.name || "-")} | ${String(column.type || "-")} | ${String(column.size ?? "-")} | ${column.nullable ? "YES" : "NO"} | ${String(column.defaultValue ?? "-")} | ${String(column.comment || "-")} |`,
      );
    });
    lines.push("");
  });

  return lines.join("\n");
};

const exportMarkdownFile = (content: string, filename: string) => {
  const blob = new Blob([content], {
    type: "text/markdown;charset=UTF-8",
  });
  downloadBlob(blob, `${normalizeFilename(filename)}.md`);
};

export const exportStructureToWord = async (
  structure: JdbcTableStructure,
  documentContent: string,
  aiContent: string,
) => {
  const title = normalizeFilename(structure.tableName || "panel-document");
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `${structure.tableName} 数据表文档`,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            children: [
              new TextRun(`Catalog：${structure.catalogName || "-"}`),
              new TextRun({ text: "    " }),
              new TextRun(`Schema：${structure.schemaName || "-"}`),
            ],
          }),
          new Paragraph({
            text: `主键：${structure.primaryKeys.join(", ") || "-"}`,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "字段定义",
            heading: HeadingLevel.HEADING_1,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["字段", "类型", "注释"].map(text =>
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
                  }),
                ),
              }),
              ...structure.columns.map(
                column =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph(String(column.name || "-"))],
                      }),
                      new TableCell({
                        children: [new Paragraph(String(column.type || "-"))],
                      }),
                      new TableCell({
                        children: [new Paragraph(String(column.comment || "-"))],
                      }),
                    ],
                  }),
              ),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "结构说明",
            heading: HeadingLevel.HEADING_1,
          }),
          ...toParagraphs(documentContent),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "AI 备注",
            heading: HeadingLevel.HEADING_1,
          }),
          ...toParagraphs(aiContent),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${title}.docx`);
};

export const exportStructureToMarkdown = async (
  structure: JdbcTableStructure,
  documentContent: string,
  aiContent: string,
) => {
  exportMarkdownFile(
    buildStructureMarkdown(structure, documentContent, aiContent),
    structure.tableName || "panel-document",
  );
};

export const exportDatabaseDocumentToWord = async (
  document: PanelDatabaseDocumentView,
) => {
  const title = normalizeFilename(document.panelCatalogName || "panel-database");
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `${document.panelCatalogName || "未命名数据库"} 数据库文档`,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: `Schema：${document.panelSchemaCount || 0}    表数量：${document.panelTableCount || 0}`,
          }),
          new Paragraph({
            text: `生成时间：${document.panelGeneratedAt || "-"}`,
          }),
          new Paragraph({ text: "" }),
          ...(document.panelTables || []).flatMap(table => [
            new Paragraph({
              text: table.panelTableName || "未命名表",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `Schema：${table.panelSchemaName || "default"}    备注：${table.panelTableComment || "-"}`,
            }),
            new Paragraph({
              text: `主键：${(table.panelPrimaryKeys || []).join(", ") || "-"}`,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: ["字段", "类型", "长度", "允许空", "默认值", "备注"].map(text =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
                    }),
                  ),
                }),
                ...(table.panelColumns || []).map(
                  column =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(String(column.name || "-"))],
                        }),
                        new TableCell({
                          children: [new Paragraph(String(column.type || "-"))],
                        }),
                        new TableCell({
                          children: [new Paragraph(String(column.size ?? "-"))],
                        }),
                        new TableCell({
                          children: [new Paragraph(column.nullable ? "YES" : "NO")],
                        }),
                        new TableCell({
                          children: [new Paragraph(String(column.defaultValue ?? "-"))],
                        }),
                        new TableCell({
                          children: [new Paragraph(String(column.comment || "-"))],
                        }),
                      ],
                    }),
                ),
              ],
            }),
            new Paragraph({ text: "" }),
          ]),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${title}.docx`);
};

export const exportDatabaseDocumentToMarkdown = async (
  document: PanelDatabaseDocumentView,
) => {
  exportMarkdownFile(
    buildDatabaseDocumentMarkdown(document),
    document.panelCatalogName || "panel-database",
  );
};

export const exportDocumentToPdf = async (
  paper: HTMLElement,
  filename: string,
) => {
  const canvas = await html2canvas(paper, {
    backgroundColor: "#f4efe7",
    scale: 2,
    useCORS: true,
  });
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const renderWidth = canvas.width * ratio;
  const renderHeight = canvas.height * ratio;
  const x = (pageWidth - renderWidth) / 2;
  const y = 12;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, renderWidth, renderHeight);
  pdf.save(`${normalizeFilename(filename)}.pdf`);
};
