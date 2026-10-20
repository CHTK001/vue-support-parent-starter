/**
 * FreeCAD 文档（{@code .fcstd}）内嵌几何提取。
 *
 * <p>{@code .fcstd} 是 **ZIP 容器**：{@code Document.xml} / {@code GuiDocument.xml}
 * 描述文档与对象，每个形状对象另存一个 {@code *.brp}（OCCT BREP 文本格式）。
 * 浏览器没有 FreeCAD 内核，但 {@code *.brp} 本身可以被既有 BREP 渲染路径
 * （PreviewModel3dPanel + occt-import-js）直接吃下，所以预览只需「解包取几何」这一步。</p>
 *
 * <p><b>为什么取最大的一份</b>：一个文档常见多个形状对象（PartShape、Cut、Fusion…），
 * 首个往往是中间体；体积最大的通常才是最终实体，预览价值最高。</p>
 */

/** 提取结果 */
export interface FcstdShape {
  /** 包内条目名（如 PartShape.brp） */
  name: string;
  /** BREP 字节 */
  bytes: Uint8Array;
}

/** jszip 的最小结构化类型（只用到本模块需要的部分，避免强依赖其完整类型） */
interface MinimalZipFile {
  name: string;
  dir: boolean;
  async: (type: "uint8array") => Promise<Uint8Array>;
}
interface MinimalZip {
  /** jszip 的 files 是「文件名 → ZipObject」的映射，不是数组 */
  files: Record<string, MinimalZipFile>;
}

/**
 * 从 {@code .fcstd} 字节中取出 BREP 几何（最大的一份）。
 *
 * @param zipBytes 整个 .fcstd 的字节
 * @returns 最大的 {@code *.brp}/{@code *.brep} 条目
 * @throws 当压缩包不可读、或不含任何 BREP 条目时
 */
export async function extractFcstdShape(zipBytes: ArrayBuffer): Promise<FcstdShape> {
  const mod = await import("jszip");
  const JSZip = (mod as unknown as { default?: unknown }).default as
    | { loadAsync: (b: ArrayBuffer) => Promise<MinimalZip> }
    | undefined;
  if (!JSZip?.loadAsync) throw new Error("JSZip 不可用，无法解包 fcstd");

  const zip = await JSZip.loadAsync(zipBytes);
  const shapes = Object.values(zip.files).filter((f) => !f.dir && /\.(brp|brep)$/i.test(f.name));
  if (shapes.length === 0) {
    throw new Error("文档里没有 .brp 几何（可能是纯参数化文档，未保存形状）");
  }

  let best: FcstdShape | null = null;
  for (const f of shapes) {
    const bytes = await f.async("uint8array");
    if (!best || bytes.byteLength > best.bytes.byteLength) {
      best = { name: f.name, bytes };
    }
  }
  if (!best) throw new Error("未能读取 .brp 几何");
  return best;
}
