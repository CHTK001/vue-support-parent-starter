import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { JdbcTableStructure } from "../api";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const normalizeFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, "_");

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
                    children: [new Paragraph({ text, bold: true })],
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
          ...documentContent.split("\n").map(line => new Paragraph(line || " ")),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "AI 备注",
            heading: HeadingLevel.HEADING_1,
          }),
          ...aiContent.split("\n").map(line => new Paragraph(line || " ")),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${title}.docx`);
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
