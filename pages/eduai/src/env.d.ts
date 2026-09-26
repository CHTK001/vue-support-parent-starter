/**
 * mammoth 浏览器构建（mammoth.browser）无官方 d.ts，
 * 此处仅声明本项目用到的最小 API。
 */
declare module "mammoth/mammoth.browser" {
  export function convertToHtml(input: {
    arrayBuffer: ArrayBuffer;
    styleMap?: string[];
  }): Promise<{ value: string; messages: unknown[] }>;
}
