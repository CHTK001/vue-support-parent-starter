import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

export default function useMarkdownIt() {
  // 创建 Markdown 解析器实例
  const md: MarkdownIt = new MarkdownIt({
    html: true, // 允许 HTML 标签
    linkify: true, // 自动转换 URL 为链接
    typographer: true, // 优化排版
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  return md;
}
