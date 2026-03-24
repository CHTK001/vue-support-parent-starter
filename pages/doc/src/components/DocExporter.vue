<template>
  <div class="doc-exporter">
    <el-dropdown trigger="click" @command="handleExport">
      <ScButton type="primary" plain>
        <i class="ri-download-2-line"></i>
        导出文档
        <i class="ri-arrow-down-s-line"></i>
      </ScButton>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="html">
            <i class="ri-html5-line"></i>
            导出 HTML
          </el-dropdown-item>
          <el-dropdown-item command="markdown">
            <i class="ri-markdown-line"></i>
            导出 Markdown
          </el-dropdown-item>
          <el-dropdown-item command="json">
            <i class="ri-braces-line"></i>
            导出 JSON
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ScMessage } from "@repo/utils";
import type { ApiGroup, ApiInfo } from "../types";

const props = defineProps<{
  /** API 分组列表 */
  apiGroups: ApiGroup[];
  /** 文档标题 */
  title?: string;
  /** 文档描述 */
  description?: string;
  /** 基础 URL */
  baseUrl?: string;
}>();

// 导出处理
const handleExport = (format: string) => {
  try {
    switch (format) {
      case "html":
        exportHtml();
        break;
      case "markdown":
        exportMarkdown();
        break;
      case "json":
        exportJson();
        break;
    }
  } catch (error) {
    console.error("Export failed:", error);
    ScMessage.error("导出失败");
  }
};

// 导出 HTML
const exportHtml = () => {
  const html = generateHtml();
  downloadFile(html, `${props.title || "API文档"}.html`, "text/html");
  ScMessage.success("HTML 文档导出成功");
};

// 导出 Markdown
const exportMarkdown = () => {
  const markdown = generateMarkdown();
  downloadFile(markdown, `${props.title || "API文档"}.md`, "text/markdown");
  ScMessage.success("Markdown 文档导出成功");
};

// 导出 JSON
const exportJson = () => {
  const json = JSON.stringify(
    {
      title: props.title,
      description: props.description,
      baseUrl: props.baseUrl,
      groups: props.apiGroups,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
  downloadFile(json, `${props.title || "API文档"}.json`, "application/json");
  ScMessage.success("JSON 文档导出成功");
};

// 生成 HTML
const generateHtml = (): string => {
  const methodColors: Record<string, string> = {
    GET: "#67c23a",
    POST: "#409eff",
    PUT: "#e6a23c",
    DELETE: "#f56c6c",
    PATCH: "#909399",
  };

  let content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(props.title || "API 文档")}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 40px; border-radius: 16px; margin-bottom: 40px; }
    .header h1 { font-size: 2.5em; margin-bottom: 16px; }
    .header p { opacity: 0.9; font-size: 1.1em; }
    .header .meta { margin-top: 20px; font-size: 0.9em; opacity: 0.8; }
    .group { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 24px; overflow: hidden; }
    .group-header { background: #f8f9fa; padding: 20px 24px; border-bottom: 1px solid #eee; }
    .group-header h2 { font-size: 1.4em; color: #303133; }
    .group-header p { color: #909399; margin-top: 4px; }
    .api-item { padding: 20px 24px; border-bottom: 1px solid #f0f0f0; }
    .api-item:last-child { border-bottom: none; }
    .api-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .method { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; color: white; }
    .path { font-family: "Fira Code", monospace; font-size: 14px; color: #606266; }
    .summary { font-size: 16px; font-weight: 500; color: #303133; }
    .description { color: #909399; margin-top: 8px; }
    .params-title { font-weight: 600; color: #606266; margin: 16px 0 8px; font-size: 14px; }
    .params-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .params-table th, .params-table td { padding: 10px 12px; text-align: left; border: 1px solid #ebeef5; }
    .params-table th { background: #fafafa; font-weight: 600; color: #606266; }
    .params-table td { color: #606266; }
    .required { color: #f56c6c; font-weight: 600; }
    .deprecated { opacity: 0.6; text-decoration: line-through; }
    .footer { text-align: center; padding: 40px; color: #909399; font-size: 14px; }
    .toc { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 24px; padding: 24px; }
    .toc h3 { margin-bottom: 16px; color: #303133; }
    .toc ul { list-style: none; }
    .toc li { padding: 6px 0; }
    .toc a { color: #409eff; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(props.title || "API 文档")}</h1>
      ${props.description ? `<p>${escapeHtml(props.description)}</p>` : ""}
      <div class="meta">
        ${props.baseUrl ? `<div>Base URL: ${escapeHtml(props.baseUrl)}</div>` : ""}
        <div>导出时间: ${new Date().toLocaleString()}</div>
      </div>
    </div>

    <div class="toc">
      <h3>目录</h3>
      <ul>
        ${props.apiGroups
          .map(
            (group, i) => `
          <li><a href="#group-${i}">${escapeHtml(group.name)}</a> (${group.apis.length})</li>
        `
          )
          .join("")}
      </ul>
    </div>
`;

  props.apiGroups.forEach((group, groupIndex) => {
    content += `
    <div class="group" id="group-${groupIndex}">
      <div class="group-header">
        <h2>${escapeHtml(group.name)}</h2>
        ${group.description ? `<p>${escapeHtml(group.description)}</p>` : ""}
      </div>
`;

    group.apis.forEach((api) => {
      const methodColor = methodColors[api.method.toUpperCase()] || "#909399";
      content += `
      <div class="api-item ${api.deprecated ? "deprecated" : ""}">
        <div class="api-header">
          <span class="method" style="background: ${methodColor}">${escapeHtml(api.method.toUpperCase())}</span>
          <span class="path">${escapeHtml(api.path)}</span>
        </div>
        <div class="summary">${escapeHtml(api.summary || "")}</div>
        ${api.description ? `<div class="description">${escapeHtml(api.description)}</div>` : ""}
`;

      // 参数表格
      if (api.parameters && api.parameters.length > 0) {
        content += `
        <div class="params-title">请求参数</div>
        <table class="params-table">
          <thead>
            <tr>
              <th>参数名</th>
              <th>位置</th>
              <th>类型</th>
              <th>必填</th>
              <th>描述</th>
            </tr>
          </thead>
          <tbody>
`;
        api.parameters.forEach((param) => {
          content += `
            <tr>
              <td>${escapeHtml(param.name)}</td>
              <td>${escapeHtml(param.in)}</td>
              <td>${escapeHtml(param.type)}</td>
              <td>${param.required ? '<span class="required">是</span>' : "否"}</td>
              <td>${escapeHtml(param.description || "-")}</td>
            </tr>
`;
        });
        content += `
          </tbody>
        </table>
`;
      }

      // 请求体
      if (api.requestBody && api.requestBody.properties) {
        content += `
        <div class="params-title">请求体</div>
        <table class="params-table">
          <thead>
            <tr>
              <th>字段名</th>
              <th>类型</th>
              <th>必填</th>
              <th>描述</th>
            </tr>
          </thead>
          <tbody>
`;
        Object.entries(api.requestBody.properties).forEach(([name, prop]) => {
          content += `
            <tr>
              <td>${escapeHtml(name)}</td>
              <td>${escapeHtml(prop.type)}</td>
              <td>${prop.required ? '<span class="required">是</span>' : "否"}</td>
              <td>${escapeHtml(prop.description || "-")}</td>
            </tr>
`;
        });
        content += `
          </tbody>
        </table>
`;
      }

      content += `
      </div>
`;
    });

    content += `
    </div>
`;
  });

  content += `
    <div class="footer">
      由 API 文档工具自动生成
    </div>
  </div>
</body>
</html>`;

  return content;
};

// 生成 Markdown
const generateMarkdown = (): string => {
  let md = `# ${props.title || "API 文档"}\n\n`;

  if (props.description) {
    md += `${props.description}\n\n`;
  }

  if (props.baseUrl) {
    md += `**Base URL:** \`${props.baseUrl}\`\n\n`;
  }

  md += `**导出时间:** ${new Date().toLocaleString()}\n\n`;

  // 目录
  md += `## 目录\n\n`;
  props.apiGroups.forEach((group, i) => {
    md += `- [${group.name}](#${group.name.toLowerCase().replace(/\s+/g, "-")}) (${group.apis.length}个接口)\n`;
  });
  md += `\n---\n\n`;

  // 分组内容
  props.apiGroups.forEach((group) => {
    md += `## ${group.name}\n\n`;
    if (group.description) {
      md += `${group.description}\n\n`;
    }

    group.apis.forEach((api) => {
      md += `### ${api.deprecated ? "~~" : ""}${api.method.toUpperCase()} ${api.path}${api.deprecated ? "~~" : ""}\n\n`;

      if (api.summary) {
        md += `**${api.summary}**\n\n`;
      }

      if (api.description) {
        md += `${api.description}\n\n`;
      }

      if (api.deprecated) {
        md += `> ⚠️ 此接口已废弃\n\n`;
      }

      // 参数
      if (api.parameters && api.parameters.length > 0) {
        md += `#### 请求参数\n\n`;
        md += `| 参数名 | 位置 | 类型 | 必填 | 描述 |\n`;
        md += `| --- | --- | --- | --- | --- |\n`;
        api.parameters.forEach((param) => {
          md += `| ${param.name} | ${param.in} | ${param.type} | ${param.required ? "**是**" : "否"} | ${param.description || "-"} |\n`;
        });
        md += `\n`;
      }

      // 请求体
      if (api.requestBody && api.requestBody.properties) {
        md += `#### 请求体\n\n`;
        md += `| 字段名 | 类型 | 必填 | 描述 |\n`;
        md += `| --- | --- | --- | --- |\n`;
        Object.entries(api.requestBody.properties).forEach(([name, prop]) => {
          md += `| ${name} | ${prop.type} | ${prop.required ? "**是**" : "否"} | ${prop.description || "-"} |\n`;
        });
        md += `\n`;
      }

      // 示例
      if (api.requestBody?.example) {
        md += `#### 请求示例\n\n`;
        md += "```json\n";
        md += JSON.stringify(api.requestBody.example, null, 2);
        md += "\n```\n\n";
      }

      md += `---\n\n`;
    });
  });

  return md;
};

// 转义 HTML
const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
};

// 下载文件
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>

<style lang="scss" scoped>
.doc-exporter {
  display: inline-block;
}
</style>
