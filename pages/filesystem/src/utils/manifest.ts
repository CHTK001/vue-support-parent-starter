/**
 * Java MANIFEST（{@code .mf} / {@code META-INF/MANIFEST.MF}）解析。
 *
 * <p>为什么不丢给 file-viewer 的 text 渲染器：它按 registry 里的扩展名选型，
 * {@code .mf} 不在其中，只会得到「该类型暂不支持在线预览」页。MANIFEST 是**有结构的
 * 键值清单**（主属性段 + 若干 {@code Name:} 条目段），自研解析比纯文本清楚。</p>
 *
 * <p><b>规范要点</b>（JAR File Specification / {@code java.util.jar.Manifest}）：</p>
 * <ul>
 *   <li>段与段之间用空行分隔；</li>
 *   <li>属性行形如 {@code Name: value}，冒号后紧跟一个空格；</li>
 *   <li>超长值按 72 字节折行，**续行以单个空格开头**，解析时要接回上一行；</li>
 *   <li>文件末尾可能有一个换行，也可能没有。</li>
 * </ul>
 */

/** 一个属性：名 + 值（续行已按规范拼接） */
export interface ManifestAttr {
  name: string;
  value: string;
}

/** 一段：主属性段（{@code title} 为空）或一个以 {@code Name:} 开头的条目段 */
export interface ManifestSection {
  title: string;
  attrs: ManifestAttr[];
}

/**
 * 解析 MANIFEST 文本。
 *
 * @param text 原始文本（UTF-8 解码后）
 * @returns 段落数组；空文本返回空数组
 */
export function parseManifest(text: string): ManifestSection[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const sections: ManifestSection[] = [];
  let cur: ManifestAttr[] = [];

  const flush = (): void => {
    if (cur.length) {
      // 条目段的首个属性通常是 Name:，用它当标题
      const nameAttr = cur.find((a) => a.name.toLowerCase() === "name");
      sections.push({ title: nameAttr ? nameAttr.value : "", attrs: cur });
      cur = [];
    }
  };

  for (const raw of lines) {
    if (raw === "") {
      flush();
      continue;
    }
    if (raw.startsWith(" ") && cur.length) {
      // 续行：接回上一个属性的值（去掉续行开头的空格）
      cur[cur.length - 1].value += raw.slice(1);
      continue;
    }
    const idx = raw.indexOf(":");
    if (idx < 0) {
      // 非法行：当成值拼到上一属性，避免整段丢失
      if (cur.length) cur[cur.length - 1].value += raw;
      continue;
    }
    const name = raw.slice(0, idx).trim();
    const v = raw.slice(idx + 1);
    cur.push({ name, value: v.startsWith(" ") ? v.slice(1) : v });
  }
  flush();
  return sections;
}
