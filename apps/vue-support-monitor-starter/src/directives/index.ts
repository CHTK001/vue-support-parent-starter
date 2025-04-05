import type { App } from "vue";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.min.css";
// 引入需要的语言支持
import "prismjs/components/prism-bash.min.js";
import "prismjs/components/prism-javascript.min.js";
import "prismjs/components/prism-typescript.min.js";
import "prismjs/components/prism-css.min.js";
import "prismjs/components/prism-scss.min.js";
import "prismjs/components/prism-java.min.js";
import "prismjs/components/prism-python.min.js";
import "prismjs/components/prism-sql.min.js";
import "prismjs/components/prism-json.min.js";
import "prismjs/components/prism-yaml.min.js";
import "prismjs/components/prism-markup.min.js"; // HTML
import "prismjs/plugins/line-numbers/prism-line-numbers.min.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";

// highlight 代码高亮指令
export const highlight = {
  mounted(el: HTMLElement) {
    const blocks = el.querySelectorAll("pre code");
    blocks.forEach(block => {
      Prism.highlightElement(block);
    });
  },
  updated(el: HTMLElement) {
    const blocks = el.querySelectorAll("pre code");
    blocks.forEach(block => {
      Prism.highlightElement(block);
    });
  }
};

// 注册所有指令
export function setupDirectives(app: App) {
  // ... existing code ...

  // 注册 v-highlight 指令
  app.directive("highlight", highlight);
}
