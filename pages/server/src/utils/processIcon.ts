/**
 * 进程 / 服务 图标 —— 常见程序的可识别单色图形（离线、零外部依赖）
 *
 * 设计：24x24 视口、currentColor 描色（外层色块里以白色呈现），
 * 按可执行文件名归类到「浏览器 / 终端 / 代码 / 数据库 / JVM / 容器 / 服务 / 脚本 / 系统」等图形；
 * 识别不到的程序返回空串，由调用方回退到「首字母」色块，保证永不空白。
 */

/** 名称 → 图形分类（先具体后通用，全部小写匹配） */
const CATEGORY: Array<[RegExp, string]> = [
  [/chrome|msedge|firefox|safari|brave|browser/i, "browser"],
  [/windowsterminal|cmd\.exe|powershell|pwsh|conhost|terminal|putty|bash|zsh|sh$|ssh|telnet/i, "terminal"],
  [/\bcode\b|idea|webstorm|pycharm|goland|phpstorm|rubymine|clion|eclipse|sublime|devenv|notepad\+\+/i, "code"],
  [/mysqld|mariadb|postgres|redis-server|redis\.exe|mongod|oracle|sqlservr|mssql|clickhouse|influxd|memcached/i, "database"],
  [/java|javaw|jdk|jvm|jre/i, "coffee"],
  [/docker|containerd|dockerd|kube|etcd|container/i, "container"],
  [/nginx|httpd|apache|tomcat|caddy|traefik/i, "server"],
  [/node|deno|bun/i, "hex"],
  [/python|pythonw|perl|ruby|php|lua/i, "script"],
  [/svchost|services\.exe|lsass|wininit|csrss|smss|system|registry|kernel|systemd|init\b/i, "gear"],
];

/** 分类 → SVG 内部图形（描边 currentColor） */
const GLYPH: Record<string, string> = {
  browser:
    '<circle cx="12" cy="12" r="9"/>'
    + '<path d="M3.2 12h17.6M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/>',
  terminal:
    '<rect x="3" y="4" width="18" height="16" rx="2"/>'
    + '<path d="M7 9l3 3-3 3M12.5 15H17"/>',
  code:
    '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5.5l-3 13"/>',
  database:
    '<ellipse cx="12" cy="5" rx="8" ry="3"/>'
    + '<path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/>'
    + '<path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  coffee:
    '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z"/>'
    + '<path d="M17 9h2a2.5 2.5 0 0 1 0 5h-2"/>'
    + '<path d="M8 2.6c-.6 1 .6 1.7 0 2.8M12 2.6c-.6 1 .6 1.7 0 2.8"/>',
  container:
    '<rect x="3" y="10" width="5" height="4"/><rect x="9" y="10" width="5" height="4"/>'
    + '<rect x="15" y="10" width="5" height="4"/>'
    + '<rect x="6" y="5" width="5" height="4"/><rect x="12" y="5" width="5" height="4"/>'
    + '<path d="M2 15c0 3 4.5 4 10 4s10-1 10-4"/>',
  server:
    '<rect x="3" y="4" width="18" height="6.5" rx="1.6"/>'
    + '<rect x="3" y="13.5" width="18" height="6.5" rx="1.6"/>'
    + '<circle cx="7" cy="7.2" r="1" fill="currentColor" stroke="none"/>'
    + '<circle cx="7" cy="16.8" r="1" fill="currentColor" stroke="none"/>',
  hex:
    '<path d="M12 2.5l8.2 4.7v9.6L12 21.5l-8.2-4.7V7.2z"/>'
    + '<path d="M9 14.5c1 1.4 5 1.4 6 0"/>',
  script:
    '<path d="M7 3h7.5L19 7.5V21H7z"/>'
    + '<path d="M14 3v4.5H19"/>'
    + '<path d="M9.5 13l-2 2 2 2M14.5 13l2 2-2 2"/>',
  gear:
    '<circle cx="12" cy="12" r="3.2"/>'
    + '<path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6'
    + 'M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
};

/**
 * 进程图标内联 SVG（v-html 渲染）
 *
 * @param name 进程/服务名（可含 .exe）
 * @returns 完整 svg；识别不到返回空串
 */
export function processGlyph(name: unknown): string {
  const n = String(name ?? "").trim();
  if (!n) return "";
  for (const [re, cat] of CATEGORY) {
    if (re.test(n) && GLYPH[cat]) {
      return '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" '
        + 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
        + 'stroke-linejoin="round" aria-hidden="true">' + GLYPH[cat] + "</svg>";
    }
  }
  return "";
}
