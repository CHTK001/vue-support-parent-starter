/**
 * 进程 / 服务 官方品牌图标 —— 常见程序的保真简化彩色 Logo（离线、零外部依赖）
 *
 * 设计：24x24 视口、全彩，几何上尽量贴近官方标志（可做适度简化但不偏离识别特征）；
 * 彩色 Logo 衬在中性白色圆角块内呈现。识别不到返回空串，
 * 由调用方依次回退到「单色线性图形 processGlyph」→「首字母色块」，保证永不空白。
 */

/** 品牌 Logo 内部图形（viewBox 0 0 24 24，透明底） */
const LOGO: Record<string, string> = {
  // Chrome：红 / 黄 / 绿 三瓣 + 蓝色圆心
  chrome:
    '<path fill="#EA4335" d="M12 12 3.34 7A10 10 0 0 1 20.66 7z"/>'
    + '<path fill="#FBBC05" d="M12 12l8.66-5A10 10 0 0 1 12 22z"/>'
    + '<path fill="#34A853" d="M12 12 12 22A10 10 0 0 1 3.34 7z"/>'
    + '<circle cx="12" cy="12" r="4.5" fill="#fff"/>'
    + '<circle cx="12" cy="12" r="3.7" fill="#4285F4"/>',
  // Edge：蓝底 + 青 / 绿 层叠漩涡
  edge:
    '<circle cx="12" cy="12" r="10" fill="#0E88DE"/>'
    + '<path fill="#3BD4E8" d="M12 4a8 8 0 0 0-8 8c0 .9.2 1.8.5 2.6C6 12 9 9.6 13 9.6c2.4 0 4.6 1 6 2.6A8 8 0 0 0 12 4z"/>'
    + '<path fill="#7BE492" d="M5.2 15.3C7 13 10 11.4 13 11.4c2 0 3.8.7 5.2 1.8-.6 2.6-3 4.8-6.2 4.8-2.8 0-5.2-1.4-6.8-2.7z"/>',
  // Firefox：蓝色地球 + 橙色火狐环绕
  firefox:
    '<circle cx="12" cy="12" r="6.4" fill="#4E9BE8"/>'
    + '<path d="M8.6 7.4A6.6 6.6 0 1 0 16.8 7" fill="none" stroke="#FF7139" stroke-width="3.3" stroke-linecap="round"/>'
    + '<circle cx="17.5" cy="6.3" r="1.5" fill="#FF8C4A"/>'
    + '<path fill="#FF7139" d="M16.3 5.2 17 3.4l.5 1.8zM18.3 5.2l1.6-.9-.6 1.7z"/>',
  // Safari：蓝色罗盘 + 红 / 白 指针
  safari:
    '<circle cx="12" cy="12" r="10" fill="#2AA6F5"/>'
    + '<circle cx="12" cy="12" r="7.3" fill="#F4F8FC"/>'
    + '<path fill="#FA4B47" d="M12 12 16.6 7.4 13.4 10.6z"/>'
    + '<path fill="#D8DEE8" d="M12 12 7.4 16.6 10.6 13.4z"/>'
    + '<circle cx="12" cy="12" r="1.05" fill="#3A86C8"/>',
  // Java：橙色咖啡杯 + 蒸汽 + 托盘
  java:
    '<path d="M9 3.5c-.7 1 .7 1.7 0 3M12 3.2c-.7 1 .7 1.7 0 3" fill="none" stroke="#F4A13A" stroke-width="1.5" stroke-linecap="round"/>'
    + '<path fill="#E76F00" d="M6.5 9h8.2v4.6a4.1 4.1 0 0 1-8.2 0z"/>'
    + '<path fill="#E76F00" d="M14.7 10h1.1a1.7 1.7 0 0 1 0 3.4h-1.1v-1.4h1a.35.35 0 0 0 0-.7h-1z"/>'
    + '<ellipse cx="10.6" cy="18.4" rx="5" ry="1.3" fill="#C9510B"/>',
  // Node.js：绿色六边形
  node:
    '<path fill="#68A063" d="M12 2l8.7 5v10L12 22l-8.7-5V7z"/>'
    + '<path d="M12 5.5l5.4 3.1v6.2L12 18l-5.4-3.2V8.6z" fill="none" stroke="#3C7540" stroke-width="1.1"/>',
  // Python：蓝 / 黄 互锁双形 + 眼睛
  python:
    '<path fill="#3776AB" d="M12 2.8c-2.7 0-3.4 1.2-3.4 2.9v1.5h6.8v.5H7.2c-1.9 0-3.5 1.1-3.5 3.3 0 2.1 1.2 3.3 3.1 3.3h1.2v-1.7c0-1.9 1.6-3.5 3.5-3.5h3.4c1.7 0 2.6-.9 2.6-2.6V5.7c0-1.7-1.4-2.9-3.4-2.9z"/>'
    + '<circle cx="10.4" cy="5.5" r=".95" fill="#fff"/>'
    + '<path fill="#FFD43B" d="M12 21.2c2.7 0 3.4-1.2 3.4-2.9v-1.5H8.6v-.5h8.2c1.9 0 3.5-1.1 3.5-3.3 0-2.1-1.2-3.3-3.1-3.3h-1.2v1.7c0 1.9-1.6 3.5-3.5 3.5H9.1c-1.6 0-2.8 1.3-2.8 2.9v1.2c0 1.7 1.4 2.9 3.4 2.9z"/>'
    + '<circle cx="13.6" cy="18.5" r=".95" fill="#fff"/>',
  // Docker：蓝色鲸背 + 白色集装箱
  docker:
    '<g fill="#fff">'
    + '<rect x="4" y="10.1" width="2.3" height="2.3"/><rect x="6.8" y="10.1" width="2.3" height="2.3"/>'
    + '<rect x="9.6" y="10.1" width="2.3" height="2.3"/><rect x="12.4" y="10.1" width="2.3" height="2.3"/>'
    + '<rect x="15.2" y="10.1" width="2.3" height="2.3"/>'
    + '<rect x="6.8" y="7.5" width="2.3" height="2.3"/><rect x="9.6" y="7.5" width="2.3" height="2.3"/>'
    + '<rect x="12.4" y="7.5" width="2.3" height="2.3"/><rect x="9.6" y="4.9" width="2.3" height="2.3"/></g>'
    + '<path fill="#2496ED" d="M3 12.7h15.2c1 2.7-1.1 5.6-5.2 6.1-3.5.4-7.2-.7-8.6-3.4C3.7 14.2 3 13.3 3 12.7z"/>'
    + '<path fill="#1B7BC4" d="M18.4 13.6c1.4-.2 2.4-.9 2.6-1.8.5 1.2-.3 2.7-1.9 3.2z"/>',
  // Redis：层叠红色菱形
  redis:
    '<path fill="#F08A7C" d="M12 4.2l3.9 1.8L12 7.8 8.1 6z"/>'
    + '<path fill="#E5604F" d="M12 8.3l5.5 2.5L12 13.3 6.5 10.8z"/>'
    + '<path fill="#DC382D" d="M12 13.8l7 3.1-7 3.1-7-3.1z"/>'
    + '<path fill="#A8261C" d="M5 16.9v1.9L12 22l7-3.2v-1.9L12 20z"/>',
  // MongoDB：绿色尖叶
  mongodb:
    '<path fill="#15994E" d="M12 2.4c2.8 3.6 4.3 7.2 4.3 10.6A4.3 4.3 0 0 1 12 17.3a4.3 4.3 0 0 1-4.3-4.3C7.7 9.6 9.2 6 12 2.4z"/>'
    + '<path d="M12 4v11.4" stroke="#0C7A3D" stroke-width="1"/>'
    + '<path fill="#0C7A3D" d="M10.8 17.5h2.4v1.5c0 .6-.5 1-1.2 1s-1.2-.4-1.2-1z"/>',
  // Nginx：绿色方块 + 白色 N
  nginx:
    '<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#009639"/>'
    + '<path d="M8.2 16V8l7.6 8V8" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
  // MySQL：青蓝色跃起海豚（简化）
  mysql:
    '<path fill="#00758F" d="M3.6 14.2c3-.9 5-2.9 5.9-5.9 1.2 2 3.1 3 6.1 3-1.5 1-2.6 2-3 3.4 1.5.3 3-.2 4-1.5.6 2-1.5 4-4 4-2 0-3-.6-4-1.4-1.6 1-3.5 1.4-5 1z"/>'
    + '<circle cx="14.6" cy="10.6" r=".7" fill="#fff"/>',
  // PostgreSQL：青蓝色象头（简化）
  postgres:
    '<path fill="#336791" d="M8.2 3.8c-2.1 0-3.2 1.7-3.2 4.1 0 1 .3 1.9.7 2.5C4.7 11.4 4 12.6 4 14c0 2 1.2 3.1 2.7 3.1.6 0 1-.2 1.4-.5v3h2v-3.5c.6.2 1.2.4 2 .4 2.4 0 4-1.8 4-4.7 0-3-2-5.4-4.4-6-.6-.9-1.8-1.4-3.5-1.4z"/>'
    + '<circle cx="12.4" cy="8.6" r=".8" fill="#fff"/>',
};

/** 名称 → 品牌（先具体后通用，全部小写匹配） */
const MATCH: Array<[RegExp, keyof typeof LOGO]> = [
  [/chrome/i, "chrome"],
  [/msedge|^edge/i, "edge"],
  [/firefox/i, "firefox"],
  [/safari/i, "safari"],
  [/java|javaw|jdk|jvm|jre/i, "java"],
  [/\bnode|nodejs/i, "node"],
  [/python|pythonw/i, "python"],
  [/docker|dockerd/i, "docker"],
  [/redis-server|redis\.exe|redis-sentinel|\bredis/i, "redis"],
  [/mongod|mongos/i, "mongodb"],
  [/nginx/i, "nginx"],
  [/mysqld|mariadb/i, "mysql"],
  [/postgres|postmaster/i, "postgres"],
];

/**
 * 进程品牌彩色图标内联 SVG（v-html 渲染）
 *
 * @param name 进程/服务名（可含 .exe）
 * @returns 完整 svg；识别不到返回空串
 */
export function processBrandIcon(name: unknown): string {
  const n = String(name ?? "").trim();
  if (!n) return "";
  for (const [re, key] of MATCH) {
    if (re.test(n) && LOGO[key]) {
      return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">'
        + LOGO[key] + "</svg>";
    }
  }
  return "";
}
