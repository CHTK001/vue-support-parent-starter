/**
 * 3D 建模标识解析。
 *
 * `edu_insect.insect_model_code` 允许一个物种复用另一个物种的 3D 模型：
 * 建模文件是按 slug 注册的程序化几何（每物种数百行 three.js），
 * 新增物种时若形态相近，先借用已有模型即可上线，不必等建模完成。
 *
 * 因此「数据身份」与「建模身份」是两件事：
 *   - 数据身份 insectCode：决定取哪条讲解/详情、记哪条笔记、分享哪个链接；
 *   - 建模身份 modelCode ：决定加载哪套几何、哪套生活史阶段模型、哪套动作。
 * 凡是与 3D 资产相关的判断（模型是否存在、有无某阶段、跑哪个动作），
 * 都必须用建模身份，否则复用了模型的物种会被误判成「未注册」。
 */

/** 物种上带建模标识的最小结构 */
export interface HasModelCode {
  insectCode: string;
  insectModelCode?: string | null;
}

/**
 * 取实际用于加载 3D 的 slug
 *
 * @param item 含 insectCode 与可选 insectModelCode 的物种
 * @returns 建模 slug：有复用标识则用它，否则用物种自身 slug
 */
export function modelSlugOf(item: HasModelCode): string {
  const reuse = item.insectModelCode;
  return reuse && reuse.trim() ? reuse.trim() : item.insectCode;
}
