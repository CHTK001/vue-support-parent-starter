/**
 * InlineMath —— TipTap 行内公式节点（KaTeX 渲染）
 *
 * 序列化：<span data-latex="\sqrt{2}">$\sqrt{2}$</span>
 *  - 编辑器内由 MathNodeView 渲染成公式，点击可编辑
 *  - 纯文本化（去标签）后即为 $...$，表格/卡片摘要可直接复用同一套渲染
 */
import { InputRule, mergeAttributes, Node, PasteRule } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import MathNodeView from "./MathNodeView.vue";

export interface InlineMathOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineMath: {
      /** 在光标处插入行内公式 */
      insertInlineMath: (latex: string) => ReturnType;
    };
  }
}

export const InlineMath = Node.create<InlineMathOptions>({
  name: "inlineMath",

  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => (element as HTMLElement).getAttribute("data-latex") || "",
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-latex]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = String(node.attrs.latex ?? "");
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-latex": latex,
        class: "rx-inline-math-serialized",
      }),
      `$${latex}$`,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(MathNodeView as never);
  },

  /** 输入 $...$ 自动转换为公式节点（避免用户看到源码） */
  addInputRules() {
    return [
      new InputRule({
        find: /\$([^$\n]+)\$$/,
        handler: ({ state, range, match }) => {
          const latex = (match[1] ?? "").trim();
          if (!latex) return;
          state.tr.replaceWith(range.from, range.to, this.type.create({ latex }));
        },
      }),
    ];
  },

  /** 粘贴文本里的 $...$ 同样自动转换为公式节点 */
  addPasteRules() {
    return [
      new PasteRule({
        find: /\$([^$\n]+)\$/g,
        handler: ({ state, range, match }) => {
          const latex = (match[1] ?? "").trim();
          if (!latex) return;
          state.tr.replaceWith(range.from, range.to, this.type.create({ latex }));
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertInlineMath:
        (latex: string) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex } }),
    };
  },
});
