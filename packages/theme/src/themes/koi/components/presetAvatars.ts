/**
 * 预置动态头像（APNG）清单
 *
 * 资产位于各应用 `public/avatars/apng-*.png`（由
 * apps/vue-support-monitor-starter/scripts/build-apng-avatars.mjs 程序化生成，
 * 256×256、12 帧、80ms/帧、无限循环；首帧走 IDAT，旧浏览器静态兜底）。
 *
 * 运行期 URL 必须用字面量 `import.meta.env.BASE_URL` 拼接：vite 按该文本做
 * 常量替换，写成可选链会替换不到；dev 与生产一致以 `/avatars/...` 暴露，
 * 兼容子路径部署。佩戴时后端 `sysUserAvatar` 直接存该完整 URL。
 */

export interface PresetAvatar {
  /** 稳定 key（与资产文件名对应） */
  key: string;
  /** 展示名 */
  name: string;
  /** 头像图片 URL（APNG 动图） */
  url: string;
}

/** 按部署 base 拼出 public 资产 URL */
function withBase(file: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.endsWith("/") ? base : `${base}/`}avatars/${file}`;
}

/** 六款「能量 sphere」风格动态头像 */
export const PRESET_AVATARS: PresetAvatar[] = [
  { key: "aurora", name: "极光", url: withBase("apng-aurora.png") },
  { key: "ember", name: "焰心", url: withBase("apng-ember.png") },
  { key: "ring", name: "星环", url: withBase("apng-ring.png") },
  { key: "sakura", name: "樱雪", url: withBase("apng-sakura.png") },
  { key: "storm", name: "雷弧", url: withBase("apng-storm.png") },
  { key: "nebula", name: "星漩", url: withBase("apng-nebula.png") },
];
